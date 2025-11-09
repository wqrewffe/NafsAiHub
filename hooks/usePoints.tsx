import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

/**
 * Interface for the detailed points state.
 * isAdmin is included to handle dynamic role changes.
 */
interface PointsState {
  toolPoints: number;
  referralPoints: number;
  isAdmin: boolean;
  total: number;
  lastUpdated: number;
}

const INITIAL_POINTS_STATE: Omit<PointsState, 'lastUpdated'> = {
  toolPoints: 0,
  referralPoints: 0,
  isAdmin: false,
  total: 0,
};

/**
 * A hook to manage and provide real-time updates for a user's points.
 * It combines points from tool usage and referrals, and handles a special case for admin users.
 */
export function usePoints() {
  const { currentUser } = useAuth();
  // Try to load from cache immediately for instant display - check for any cached user
  const [isLoading, setIsLoading] = useState(false); // Don't show loading initially
  const [pointsState, setPointsState] = useState<PointsState>(() => {
    // Try to get cached points from localStorage for instant display
    // Check for the most recent user's cached points
    try {
      if (currentUser) {
        const cached = localStorage.getItem(`points_${currentUser.uid}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.lastUpdated && Date.now() - parsed.lastUpdated < 60000) { // 1 minute cache
            return parsed;
          }
        }
      } else {
        // Try to find any cached user points (for when auth hasn't loaded yet)
        const keys = Object.keys(localStorage);
        const pointsKey = keys.find(k => k.startsWith('points_'));
        if (pointsKey) {
          const cached = localStorage.getItem(pointsKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.lastUpdated && Date.now() - parsed.lastUpdated < 300000) { // 5 minute cache for unknown user
              return parsed;
            }
          }
        }
      }
    } catch (e) {
      // Ignore cache errors
    }
    return { ...INITIAL_POINTS_STATE, lastUpdated: Date.now() };
  });

  useEffect(() => {
    // If there is no user, keep cached state but don't load
    if (!currentUser) {
      setIsLoading(false);
      // Don't reset state - keep cached data visible
      return;
    }

    // Only show loading if we don't have cached data
    const hasCache = pointsState.lastUpdated > 0 && Date.now() - pointsState.lastUpdated < 60000;
    setIsLoading(!hasCache);

    // Flags to track if the initial data from each listener has been received.
    // This helps determine when the initial loading is complete.
    let toolAccessLoaded = false;
    let userInfoLoaded = false;

    const checkInitialLoadDone = () => {
      if (toolAccessLoaded && userInfoLoaded) {
        setIsLoading(false);
      }
    };

    // Listener for the user's points in the 'users' collection
    const unsubscribePoints = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const points = data?.points || 0;
          const isAdmin = data?.role === 'admin';

          setPointsState((prev) => {
            const newState = {
              ...prev,
              toolPoints: points,
              isAdmin,
              total: isAdmin ? Number.MAX_SAFE_INTEGER : points + prev.referralPoints,
              lastUpdated: Date.now(),
            };
            // Cache points for instant display on next load
            if (currentUser) {
              try {
                localStorage.setItem(`points_${currentUser.uid}`, JSON.stringify(newState));
              } catch (e) {
                // Ignore storage errors
              }
            }
            return newState;
          });
        }
        
        if (!toolAccessLoaded) {
          toolAccessLoaded = true;
          checkInitialLoadDone();
        }
      },
      (error) => {
        console.error('Error in points listener:', error);
        setPointsState((prev) => ({ 
          ...prev, 
          toolPoints: 0, 
          isAdmin: false,
          total: 0
        }));
        if (!toolAccessLoaded) {
          toolAccessLoaded = true;
          checkInitialLoadDone();
        }
      }
    );

    // Listener for referral points from user document
    const unsubscribeReferral = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const referralPoints = data?.referralInfo?.rewards || 0;

          setPointsState((prev) => {
            const newTotal = prev.isAdmin 
              ? Number.MAX_SAFE_INTEGER 
              : prev.toolPoints + referralPoints;

            const newState = {
              ...prev,
              referralPoints,
              total: newTotal,
              lastUpdated: Date.now(),
            };
            // Cache points for instant display on next load
            if (currentUser) {
              try {
                localStorage.setItem(`points_${currentUser.uid}`, JSON.stringify(newState));
              } catch (e) {
                // Ignore storage errors
              }
            }
            return newState;
          });
        }
        
        if (!userInfoLoaded) {
          userInfoLoaded = true;
          checkInitialLoadDone();
        }
      },
      (error) => {
        console.error('Error in referral points listener:', error);
        setPointsState((prev) => ({ 
          ...prev, 
          referralPoints: 0,
          total: prev.isAdmin ? Number.MAX_SAFE_INTEGER : prev.toolPoints 
        }));
        if (!userInfoLoaded) {
          userInfoLoaded = true;
          checkInitialLoadDone();
        }
      }
    );

    // Cleanup: Unsubscribe from listeners when component unmounts or user changes
    return () => {
      unsubscribePoints();
      unsubscribeReferral();
    };
  }, [currentUser]);

  return {
    points: pointsState.total,
    referralPoints: pointsState.referralPoints,
    isAdmin: pointsState.isAdmin,
    isInfinite: pointsState.isAdmin,
    isLoading,
    lastUpdated: pointsState.lastUpdated
  };
}
