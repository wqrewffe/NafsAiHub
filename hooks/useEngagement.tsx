import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useEngagement = () => {
  const { currentUser } = useAuth();
  const [streak, setStreak] = useState(0);
  const [dailyReward, setDailyReward] = useState<string | null>(null);
  const [lastActive, setLastActive] = useState<Date | null>(null);

  // Random rewards pool
  const DAILY_LOGIN_POINTS = 25;
const STREAK_MILESTONE = 5;
const STREAK_BONUS_POINTS = 100;

const rewards = [
    'double_points',
    'special_badge',
    'tool_unlock',
    'bonus_features'
  ];

  useEffect(() => {
    if (!currentUser) return;

    const checkAndUpdateStreak = async () => {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      const today = new Date();
      const lastActiveDate = userData?.lastActive?.toDate() || null;
      
      if (!lastActiveDate) {
        // First time user
        const isAdmin = userData?.role === 'admin';
        await updateDoc(userRef, {
          streak: 1,
          lastActive: today,
          points: isAdmin ? Number.MAX_SAFE_INTEGER : (userData?.points || 0) + DAILY_LOGIN_POINTS
        });
        setStreak(1);
      } else {
        const daysSinceLastActive = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastActive === 1) {
          // Consecutive day
          const newStreak = (userData?.streak || 0) + 1;
          const isAdmin = userData?.role === 'admin';
          const updates: any = {
            streak: newStreak,
            lastActive: today,
            points: increment(DAILY_LOGIN_POINTS)
          };

          // Bonus points for streak milestones
          if (newStreak % STREAK_MILESTONE === 0) {
            updates.points = increment(DAILY_LOGIN_POINTS + STREAK_BONUS_POINTS);
          }

          await updateDoc(userRef, updates);
          setStreak(newStreak);
          
          // Random reward on streak milestones
          if (newStreak % 5 === 0) {
            const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
            setDailyReward(randomReward);
          }
        } else if (daysSinceLastActive > 1) {
          // Streak broken
          await updateDoc(userRef, {
            streak: 1,
            lastActive: today,
          });
          setStreak(1);
        }
      }
    };

    checkAndUpdateStreak();
  }, [currentUser]);

  return {
    streak,
    dailyReward,
    lastActive
  };
};
