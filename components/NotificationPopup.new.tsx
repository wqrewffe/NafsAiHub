import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { notificationService, Notification } from '../services/notificationService';
import {
  BellIcon,
  XMarkIcon,
  ArrowRightIcon,
  GiftIcon,
  FireIcon,
  UserPlusIcon,
  SparklesIcon,
  TrophyIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import './NotificationPopup.css';

const AUTO_DISMISS_DELAY = 5000; // 5 seconds

const NotificationPopup: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [animationState, setAnimationState] = useState<'slide-in' | 'slide-out' | ''>('');
  const autoDismissTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  const showNextNotification = useCallback(() => {
    if (notifications.length > 0) {
      const nextNotification = notifications[0];
      console.log('Showing notification:', nextNotification);
      setCurrentNotification(nextNotification);
      setIsVisible(true);
      setAnimationState('slide-in');
      setNotifications(prev => prev.slice(1));

      // Set auto-dismiss timer
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
      autoDismissTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, AUTO_DISMISS_DELAY);
    } else {
      setHasUnreadNotifications(false);
    }
  }, [notifications]);

  const handleDismiss = useCallback(async () => {
    if (currentNotification) {
      setAnimationState('slide-out');
      try {
        await notificationService.dismiss(currentNotification.id);
      } catch (error) {
        console.error('Error dismissing notification:', error);
      }
      
      setTimeout(() => {
        setIsVisible(false);
        setCurrentNotification(null);
        setAnimationState('');
        setTimeout(showNextNotification, 100);
      }, 500);
    }
  }, [currentNotification, showNextNotification]);

  useEffect(() => {
    if (currentUser) {
      console.log('Setting up notification listeners for user:', currentUser.uid);
      
      // Set up real-time listener for notifications
      const notificationsRef = db.collection('notifications')
        .where('userId', '==', currentUser.uid)
        .where('dismissed', '==', false)
        .where('read', '==', false)
        .orderBy('createdAt', 'desc');

      const unsubscribe = notificationsRef.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const notification = {
              id: change.doc.id,
              ...change.doc.data()
            } as Notification;
            console.log('New notification received:', notification);
            setNotifications(prev => [...prev, notification]);
            setHasUnreadNotifications(true);
            if (!currentNotification) {
              showNextNotification();
            }
          }
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
    }
  }, [currentUser, currentNotification, showNextNotification]);

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
        // Handle claiming rewards
        break;
    }

    handleDismiss();
  }, [currentNotification, navigate, handleDismiss]);

  if (!isVisible || !currentNotification) return null;

  return (
    <div 
      className={`notification-popup fixed top-4 right-4 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 z-50 ${animationState}`}
      role="alert"
    >
      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          {currentNotification.type === 'reward' && currentNotification.reward?.type === 'points' ? (
            <div className="relative">
              <GiftIcon className="h-8 w-8 text-green-500" />
              <CurrencyDollarIcon className="h-4 w-4 text-yellow-400 absolute -bottom-1 -right-1" />
            </div>
          ) : (
            <BellIcon className="h-6 w-6 text-blue-500" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentNotification.title}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {currentNotification.message}
          </p>

          {/* Points Animation */}
          {currentNotification.reward?.type === 'points' && (
            <div className="mt-2">
              <span className="points-value">+{currentNotification.reward.amount}</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">points</span>
            </div>
          )}

          {/* Action Button */}
          {currentNotification.action && (
            <button
              onClick={handleAction}
              className="mt-3 inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-full transition-colors"
            >
              {currentNotification.action.type === 'claim' ? 'Claim Now' : "View Details"}
              <ArrowRightIcon className="ml-1.5 h-4 w-4" />
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => handleDismiss()}
          className="flex-shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          aria-label="Close notification"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default NotificationPopup;
