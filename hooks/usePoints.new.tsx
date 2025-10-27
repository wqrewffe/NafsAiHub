import { useEffect, useState, useCallback } from 'react';
import { toolAccessService } from '../services/toolAccessService';
import { useAuth } from './useAuth';
import { getReferralInfo } from '../services/referralService';
import { db } from '../firebase/config';
import firebase from 'firebase/compat/app';

interface PointsState {
  toolPoints: number;
  referralPoints: number;
  total: number;
}

export function usePoints() {
  const { currentUser } = useAuth();
  const [points, setPoints] = useState<number>(0);
  const [isInfinite, setIsInfinite] = useState(false);
  const [pointsState, setPointsState] = useState<PointsState>({
    toolPoints: 0,
    referralPoints: 0,
    total: 0
  });

  const updatePoints = useCallback((toolPoints: number, referralPoints: number) => {
    const total = Math.max(0, toolPoints + referralPoints);
    setPointsState({ toolPoints, referralPoints, total });
    setPoints(total);
  }, []);

  useEffect(() => {
    let isUserAdmin = false;
    let unsubscribeUser: () => void;
    let unsubscribeToolAccess: () => void;
    let isMounted = true;

    if (!currentUser) {
      setPoints(0);
      setIsInfinite(false);
      setPointsState({ toolPoints: 0, referralPoints: 0, total: 0 });
      return;
    }

    const loadPoints = async () => {
      try {
        const [access, referralInfo] = await Promise.all([
          toolAccessService.getToolAccess(currentUser.uid),
          getReferralInfo(currentUser.uid)
        ]);
        
        isUserAdmin = access.isAdmin;
        
        if (isUserAdmin) {
          setIsInfinite(true);
          setPoints(Number.MAX_SAFE_INTEGER);
          setPointsState({
            toolPoints: Number.MAX_SAFE_INTEGER,
            referralPoints: 0,
            total: Number.MAX_SAFE_INTEGER
          });
          return;
        }

        setIsInfinite(false);
        const toolPoints = access.points || 0;
        const referralPoints = referralInfo?.rewards || 0;
        
        if (isMounted) {
          updatePoints(toolPoints, referralPoints);
        }
      } catch (error) {
        console.error('Error loading points:', error);
        if (isMounted) {
          updatePoints(0, 0);
        }
      }
    };

    // Initial load
    loadPoints();

    if (!isUserAdmin) {
      // Listen for user points changes (referral points)
      unsubscribeUser = db.collection('users').doc(currentUser.uid)
        .onSnapshot({
          next: async (doc) => {
            if (!isMounted) return;
            
            try {
              if (doc.exists) {
                const userData = doc.data();
                const referralPoints = userData?.referralInfo?.rewards || 0;
                const toolAccess = await toolAccessService.getToolAccess(currentUser.uid);
                const toolPoints = toolAccess.points || 0;

                updatePoints(toolPoints, referralPoints);

                console.log('Points updated from user doc:', {
                  toolPoints,
                  referralPoints,
                  total: toolPoints + referralPoints,
                  timestamp: firebase.firestore.Timestamp.now()
                });
              }
            } catch (error) {
              console.error('Error processing user points update:', error);
            }
          },
          error: (error) => {
            console.error('Error in user points listener:', error);
            if (isMounted) {
              setTimeout(loadPoints, 5000);
            }
          }
        });

      // Listen for tool access changes (tool points)
      unsubscribeToolAccess = db.collection('toolAccess').doc(currentUser.uid)
        .onSnapshot({
          next: async (doc) => {
            if (!isMounted) return;

            try {
              if (doc.exists) {
                const accessData = doc.data();
                const toolPoints = accessData?.points || 0;
                
                // Get current referral points
                const userDoc = await db.collection('users').doc(currentUser.uid).get();
                const userData = userDoc.data();
                const referralPoints = userData?.referralInfo?.rewards || 0;

                updatePoints(toolPoints, referralPoints);

                console.log('Points updated from tool access:', {
                  toolPoints,
                  referralPoints,
                  total: toolPoints + referralPoints,
                  timestamp: firebase.firestore.Timestamp.now()
                });
              }
            } catch (error) {
              console.error('Error processing tool access update:', error);
            }
          },
          error: (error) => {
            console.error('Error in tool access listener:', error);
            if (isMounted) {
              setTimeout(loadPoints, 5000);
            }
          }
        });
    }

    return () => {
      isMounted = false;
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeToolAccess) unsubscribeToolAccess();
    };
  }, [currentUser, updatePoints]);

  return { points, isInfinite, pointsState };
}
