import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { notificationService, Notification } from '../services/notificationService';
import {
  BellIcon,
  ArrowRightIcon,
  GiftIcon,
  FireIcon,
  UserPlusIcon,
  SparklesIcon,
  TrophyIcon,
} from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
// Ensure your CSS file is imported
import './NotificationPopup.css';

const AUTO_DISMISS_DELAY = 5000; // 5 seconds

const NotificationPopup: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notificationQueue, setNotificationQueue] = useState<Notification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const [showConfetti, setShowConfetti] = useState(false);
  const autoDismissTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Debug logging for component state
  useEffect(() => {
    console.log('🔄 Notification state updated:', {
      currentNotification: currentNotification?.id,
      queueLength: notificationQueue.length,
      isVisible,
      isExiting,
      userId: currentUser?.uid
    });
  }, [currentNotification, notificationQueue.length, isVisible, isExiting, currentUser?.uid]);
  
  // Ref to hold the current notification to avoid stale closures in the Firestore listener
  const currentNotificationRef = useRef(currentNotification);
  useEffect(() => {
    currentNotificationRef.current = currentNotification;
  }, [currentNotification]);

  const handleDismiss = useCallback(async () => {
    if (currentNotificationRef.current) {
      setIsExiting(true);
      // Mark as dismissed in the backend without waiting for a responsive feel
      notificationService.dismiss(currentNotificationRef.current.id);
      
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
      
      // Wait for the exit animation (500ms) to finish
      setTimeout(() => {
        setIsVisible(false);
        setIsExiting(false);
        setCurrentNotification(null);
        // The queue runner effect will automatically show the next notification
      }, 500);
    }
  }, []);

  const showNextNotification = useCallback(() => {
    console.log('🔄 Checking notifications:', {
      queueLength: notificationQueue.length,
      isVisible,
      currentNotification: currentNotification?.id
    });

    if (notificationQueue.length > 0) {
      const nextNotification = notificationQueue[0];
      console.log('📢 Showing notification:', {
        id: nextNotification.id,
        type: nextNotification.type,
        title: nextNotification.title
      });

      // Clear any existing timer
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }

      // Update state in the correct order
      setCurrentNotification(nextNotification);
      setNotificationQueue(prev => prev.slice(1));
      requestAnimationFrame(() => {
        setIsVisible(true);
        setProgress(100);
      });
      
      // Set new auto-dismiss timer
      autoDismissTimerRef.current = setTimeout(() => {
        console.log('⏲️ Auto-dismissing notification:', nextNotification.id);
        handleDismiss();
      }, AUTO_DISMISS_DELAY);
    }
  }, [notificationQueue, handleDismiss, currentNotification?.id]);

  // Main Effect for loading and listening to notifications.
  useEffect(() => {
    if (!currentUser) {
      // Clear all state on logout
      setNotificationQueue([]);
      setCurrentNotification(null);
      setIsVisible(false);
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
      return;
    }

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', currentUser.uid),
      where('dismissed', '==', false),
      where('read', '==', false),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const serverNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      
      // Reconcile server state with client queue to avoid duplicates
      setNotificationQueue(prevQueue => {
        const existingIds = new Set(prevQueue.map(n => n.id));
        if (currentNotificationRef.current) {
          existingIds.add(currentNotificationRef.current.id);
        }
        const newNotifications = serverNotifications.filter(n => !existingIds.has(n.id));
        return [...prevQueue, ...newNotifications];
      });
    }, error => {
      console.error('Error in notification listener:', error);
    });

    return () => {
      unsubscribe();
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
    };
  }, [currentUser]);

  // Effect to run the queue: shows the next notification when the current one is dismissed.
  useEffect(() => {
    if (!isVisible && notificationQueue.length > 0) {
      showNextNotification();
    }
  }, [notificationQueue, isVisible, showNextNotification]);

  // Effect to manage the progress bar animation
  useEffect(() => {
    if (isVisible && !isExiting) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_DELAY) * 100);
        setProgress(remaining);
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isVisible, isExiting]);
  
  // Effect to trigger confetti for special notifications
  useEffect(() => {
    if (currentNotification && isVisible) {
      if (currentNotification.type === 'achievement' || currentNotification.type === 'reward') {
        setShowConfetti(true);
        const timer = setTimeout(() => setShowConfetti(false), 3000);
        return () => clearTimeout(timer);
      }
    }
    setShowConfetti(false);
  }, [currentNotification, isVisible]);

  const handleAction = useCallback(async () => {
    if (!currentNotification?.action) return;

    switch (currentNotification.action.type) {
      case 'navigate':
        navigate(currentNotification.action.destination!);
        break;
      case 'try_tool':
        navigate(`/tool/${currentNotification.action.toolId}`);
        break;
      case 'invite':
        navigate('/referral');
        break;
      case 'claim':
        console.log('Claiming reward for notification:', currentNotification.id);
        break;
    }
    handleDismiss();
  }, [currentNotification, navigate, handleDismiss]);

  const getIcon = (type: Notification['type']) => {
    const iconClass = "h-6 w-6";
    switch (type) {
      case 'achievement': return <TrophyIcon className={`${iconClass} text-yellow-500`} />;
      case 'reward': return <GiftIcon className={`${iconClass} text-green-500`} />;
      case 'streak': return <FireIcon className={`${iconClass} text-orange-500`} />;
      case 'referral': return <UserPlusIcon className={`${iconClass} text-blue-500`} />;
      case 'suggestion': return <SparklesIcon className={`${iconClass} text-purple-500`} />;
      default: return <BellIcon className={`${iconClass} text-gray-500`} />;
    }
  };

  // --- DEBUGGING: Remove or comment out for production ---
  useEffect(() => {
    if (!currentUser || process.env.NODE_ENV !== 'development') return;

    // This effect creates test notifications for easier development
    // It runs if nothing is currently being shown and the queue is empty
    if (!currentNotification && !isVisible && notificationQueue.length === 0) {
      setTimeout(() => {
        Promise.all([
          notificationService.createNotification(currentUser.uid, {
            type: 'achievement',
            title: '🏆 Achievement Unlocked!',
            message: 'You have mastered the art of testing notifications.',
            action: { type: 'navigate', destination: '/achievements' },
            reward: { type: 'points', amount: 100 },
            priority: 'high'
          }),
          notificationService.createNotification(currentUser.uid, {
            type: 'suggestion',
            title: '💡 Try The New Feature!',
            message: 'We have a new tool that we think you\'ll love.',
            action: { type: 'try_tool', toolId: 'new-tool-123' },
            priority: 'medium'
          })
        ]).catch(error => {
          console.error('Error creating test notifications:', error);
        });
      }, 2000); // Delay to avoid running on every hot-reload
    }
  }, [currentUser, currentNotification, isVisible, notificationQueue]);
  // --- END DEBUGGING ---

  if (!isVisible && !currentNotification) {
    return null; // Don't render anything if there's nothing to show
  }

  // Fallback in case component tries to render without a notification object
  if (!currentNotification) {
    return null;
  }

  const isErrorType = currentNotification.title.toLowerCase().includes('not enough') || currentNotification.title.toLowerCase().includes('insufficient');

  return (
    <div 
      className={`notification-wrapper ${isVisible ? 'visible' : ''}`}
      role="alert"
    >
      <div className="notification-backdrop" />
      <div className={`notification-content ${isExiting ? 'fade-out' : 'fade-in'}`}>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-fall"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 4}s`,
                  animationDuration: `${2 + Math.random() * 3}s`,
                }}
              >
                {['🎉', '🎊', '⭐', '💫', '🌟', '✨'][Math.floor(Math.random() * 6)]}
              </div>
            ))}
          </div>
        )}

        <div className={`bg-secondary rounded-lg shadow-xl w-full max-w-md mx-4 p-6 relative overflow-hidden ${isExiting ? 'scale-out' : 'scale-in'}`}>
          <div className="text-center">
            <div className={`text-6xl mb-4 inline-block ${isErrorType ? 'animate-shake' : 'animate-bounce'}`}>
              {isErrorType ? '⚠️' : 
              currentNotification.type === 'reward' && currentNotification.reward?.type === 'points' ? '💰' : 
              currentNotification.type === 'achievement' ? '🏆' : 
              currentNotification.type === 'suggestion' ? '💡' : 
              getIcon(currentNotification.type)}
            </div>

            <h2 className="text-2xl font-bold text-light mb-4">
              {currentNotification.title}
            </h2>

            <p className="text-slate-300 mb-6">
              {currentNotification.message}
            </p>

            {currentNotification.reward && (
              <div className="mb-6 text-center">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/20 text-primary font-semibold">
                  <GiftIcon className="h-5 w-5 mr-2" />
                  {currentNotification.reward.type === 'xp' && `+${currentNotification.reward.amount} XP`}
                  {currentNotification.reward.type === 'points' && `+${currentNotification.reward.amount} Points`}
                  {currentNotification.reward.type === 'badge' && `New Badge: ${currentNotification.reward.item}`}
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              {currentNotification.action && (
                <button
                  onClick={handleAction}
                  className="bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 flex items-center"
                >
                  {currentNotification.action.type === 'claim' ? 'Claim Now!' : 'Let\'s Go!'}
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
              >
                {currentNotification.action ? 'Maybe Later' : 'Got it!'}
              </button>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              className={`h-full ${isErrorType ? 'bg-red-500' : 'bg-primary'} transition-all duration-100 ease-linear`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationPopup;