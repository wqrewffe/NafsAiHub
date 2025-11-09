import { db } from '../firebase/config';
import { doc, getDoc, setDoc, collection, addDoc, query, where, orderBy, limit, getDocs, updateDoc } from 'firebase/firestore';

export interface Notification {
  id: string;
  userId: string;
  type: 'achievement' | 'reward' | 'streak' | 'referral' | 'suggestion' | 'milestone' | 'challenge';
  title: string;
  message: string;
  reward?: {
    type: 'xp' | 'points' | 'feature' | 'badge';
    amount?: number;
    item?: string;
  };
  action?: {
    type: 'navigate' | 'share' | 'try_tool' | 'invite' | 'claim';
    destination?: string;
    toolId?: string;
  };
  thumbnail?: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  dismissed: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

export const notificationService = {
  async createNotification(userId: string, notification: Omit<Notification, 'id' | 'userId' | 'read' | 'dismissed' | 'createdAt'>) {
    console.log('🔔 Creating notification:', {
      userId,
      type: notification.type,
      title: notification.title
    });
    
    const notificationsRef = collection(db, 'notifications');
    
    const notificationData = {
      ...notification,
      userId,
      read: false,
      dismissed: false,
      createdAt: new Date()
    };

    try {
      const docRef = await addDoc(notificationsRef, notificationData);
      console.log('✅ Notification created successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  },

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('dismissed', '==', false),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));
  },

  async markAsRead(notificationId: string) {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  },

  async dismiss(notificationId: string) {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { dismissed: true });
  },

  // Notification triggers
  async checkAndTriggerToolSuggestion(userId: string, lastUsedToolId: string) {
    const userPrefRef = doc(db, 'userPreferences', userId);
    const prefs = await getDoc(userPrefRef);
    const data = prefs.data();
    
    if (data) {
      const suggestedTool = data.lastUsedTools.find(toolId => 
        toolId !== lastUsedToolId && Math.random() > 0.7 // 30% chance to suggest a previously used tool
      );

      if (suggestedTool) {
        await this.createNotification(userId, {
          type: 'suggestion',
          title: 'Try This Tool Next!',
          message: 'Based on your recent activity, you might enjoy using this tool.',
          priority: 'medium',
          action: {
            type: 'try_tool',
            toolId: suggestedTool
          }
        });
      }
    }
  },

  async triggerReferralReminder(userId: string) {
    await this.createNotification(userId, {
      type: 'referral',
      title: 'Invite Friends, Earn Rewards! 🎁',
      message: 'Get 500 bonus points for each friend who joins and uses their first tool!',
      priority: 'high',
      reward: {
        type: 'points',
        amount: 500
      },
      action: {
        type: 'invite'
      }
    });
  },

  async triggerStreakMilestone(userId: string, streak: number) {
    const milestones = [3, 7, 14, 30, 60, 90];
    if (milestones.includes(streak)) {
      await this.createNotification(userId, {
        type: 'milestone',
        title: `${streak} Day Streak! 🔥`,
        message: `Amazing! You've used NafsAiHub for ${streak} days in a row!`,
        priority: 'high',
        reward: {
          type: 'xp',
          amount: streak * 100
        },
        action: {
          type: 'claim'
        }
      });
    }
  },

  async triggerToolChallenge(userId: string) {
    await this.createNotification(userId, {
      type: 'challenge',
      title: 'Daily Challenge 🎯',
      message: 'Use 3 different tools today and earn bonus XP!',
      priority: 'medium',
      reward: {
        type: 'xp',
        amount: 300
      },
      action: {
        type: 'navigate',
        destination: '/tools'
      },
      expiresAt: new Date(new Date().setHours(23, 59, 59, 999))
    });
  },

  async createPointsNotification(userId: string, points: number, source: string = 'admin') {
    await this.createNotification(userId, {
      type: 'reward',
      title: 'Points Awarded! 🎁',
      message: `You've received ${points} points${source === 'admin' ? ' from an admin' : ''}!`,
      priority: 'high',
      reward: {
        type: 'points',
        amount: points
      },
      action: {
        type: 'navigate',
        destination: '/profile'
      }
    });
  }
};
