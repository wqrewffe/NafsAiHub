import { useEffect, useState } from 'react';
import { getReferralInfo } from '../services/referralService';
import { useAuth } from './useAuth';

export function useReferralPoints() {
  const { currentUser } = useAuth();
  const [referralPoints, setReferralPoints] = useState<number>(0);

  useEffect(() => {
    if (!currentUser) {
      setReferralPoints(0);
      return;
    }
    const loadReferralPoints = async () => {
      const info = await getReferralInfo(currentUser.uid);
      setReferralPoints(info?.rewards || 0);
    };
    loadReferralPoints();
  }, [currentUser]);

  return { referralPoints };
}
