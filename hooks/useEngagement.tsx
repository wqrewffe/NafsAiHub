import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { doc, getDoc, setDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useEngagement = () => {
  const { currentUser } = useAuth();
  const [streak, setStreak] = useState(0);
  const [dailyReward, setDailyReward] = useState<string | null>(null);
  const [lastActive, setLastActive] = useState<Date | null>(null);
  const [toolUsageToday, setToolUsageToday] = useState(false);

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

  // Initialize streak from Firestore on component mount
  useEffect(() => {
    if (!currentUser) return;

    const initializeStreak = async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          // New user
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          await setDoc(userRef, {
            streak: 0,
            lastStreakDay: null,
            lastToolUsageDate: null,
            streakLastUpdated: Timestamp.now(),
            points: 0,
            role: 'user'
          }, { merge: true });
          
          setStreak(0);
        } else {
          const userData = userDoc.data();
          setStreak(userData?.streak || 0);
          
          const lastStreakDay = userData?.lastStreakDay?.toDate() || null;
          setLastActive(lastStreakDay);
          
          // Check if streak should be broken
          if (lastStreakDay) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const lastStreakDayNormalized = new Date(lastStreakDay);
            lastStreakDayNormalized.setHours(0, 0, 0, 0);
            
            const daysSinceLastStreak = Math.floor(
              (today.getTime() - lastStreakDayNormalized.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            if (daysSinceLastStreak > 1) {
              // Streak is broken
              await updateDoc(userRef, {
                streak: 0,
                lastStreakDay: null,
              });
              setStreak(0);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing streak:', error);
      }
    };

    initializeStreak();
  }, [currentUser]);

  return {
    streak,
    dailyReward,
    lastActive,
    toolUsageToday,
    setToolUsageToday
  };
};
