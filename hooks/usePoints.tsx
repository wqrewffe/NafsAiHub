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
  const [isLoading, setIsLoading] = useState(true);
  const [pointsState, setPointsState] = useState<PointsState>({
    ...INITIAL_POINTS_STATE,
    lastUpdated: 0,
  });

  useEffect(() => {
    // If there is no user, reset to the default state and stop loading.
    if (!currentUser) {
      setIsLoading(false);
      setPointsState({
        ...INITIAL_POINTS_STATE,
        lastUpdated: Date.now(),
      });
      return;
    }

    setIsLoading(true);

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

          setPointsState((prev) => ({
            ...prev,
            toolPoints: points,
            isAdmin,
            total: isAdmin ? Number.MAX_SAFE_INTEGER : points + prev.referralPoints,
            lastUpdated: Date.now(),
          }));
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

    // Listener for referral points
    const unsubscribeReferral = onSnapshot(
      doc(db, 'referrals', currentUser.uid),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const referralPoints = data?.rewards || 0;

          setPointsState((prev) => {
            const newTotal = prev.isAdmin 
              ? Number.MAX_SAFE_INTEGER 
              : prev.toolPoints + referralPoints;

            return {
              ...prev,
              referralPoints,
              total: newTotal,
              lastUpdated: Date.now(),
            };
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
