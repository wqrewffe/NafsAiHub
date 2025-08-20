
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { BadgesDisplay } from '../components/BadgesDisplay';
import { getReferralInfo } from '../services/referralService';
import { ReferralInfo } from '../types';

const ProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);

  useEffect(() => {
    const loadReferralInfo = async () => {
      if (currentUser) {
        try {
          const info = await getReferralInfo(currentUser.uid);
          setReferralInfo(info);
        } catch (error) {
          console.error('Error loading referral info:', error);
        }
      }
    };

    loadReferralInfo();
  }, [currentUser]);

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-slate-400 mt-2">View your account information below.</p>
      </div>
      
      <div className="bg-secondary p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Account Details</h2>
        {currentUser ? (
           <div className="space-y-3">
                 {currentUser.displayName && (
                    <p className="text-slate-300">
                        <strong className="font-medium text-slate-100">Full Name:</strong> {currentUser.displayName}
                    </p>
                )}
                <p className="text-slate-300">
                    <strong className="font-medium text-slate-100">Email:</strong> {currentUser.email}
                </p>
                <p className="text-slate-300">
                    <strong className="font-medium text-slate-100">User ID:</strong> <span className="text-xs font-mono">{currentUser.uid}</span>
                </p>
           </div>
        ) : (
            <p className="text-slate-400">Could not load user information.</p>
        )}
      </div>

      {/* Referral Stats */}
      {referralInfo && (
        <div className="bg-secondary p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Referral Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gray-700 rounded-lg">
              <p className="text-slate-400 text-sm">Total Referrals</p>
              <p className="text-2xl font-bold">{referralInfo.referralsCount}</p>
            </div>
            <div className="p-4 bg-gray-700 rounded-lg">
              <p className="text-slate-400 text-sm">Rewards Points</p>
              <p className="text-2xl font-bold">{referralInfo.rewards}</p>
            </div>
            <div className="p-4 bg-gray-700 rounded-lg">
              <p className="text-slate-400 text-sm">Referral Code</p>
              <p className="text-xl font-mono">{referralInfo.referralCode}</p>
            </div>
          </div>
        </div>
      )}

      {/* Badges and Achievements */}
      {referralInfo && (
        <BadgesDisplay 
          badges={referralInfo.badges}
          level={referralInfo.level}
          nextLevelPoints={referralInfo.nextLevelPoints}
        />
      )}
    </div>
  );
};

export default ProfilePage;