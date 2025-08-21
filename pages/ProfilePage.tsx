
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { BadgesDisplay } from '../components/BadgesDisplay';
import { getReferralInfo } from '../services/referralService';
import { getToolUsageInfo } from '../services/toolUsageService';
import { ReferralInfo } from '../types';
import { ToolUsageInfo } from '../services/toolUsageService';

const ProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [toolUsageInfo, setToolUsageInfo] = useState<ToolUsageInfo | null>(null);

  useEffect(() => {
    const loadUserInfo = async () => {
      if (currentUser) {
        try {
          // Load both referral info and tool usage info
          const [referralData, toolData] = await Promise.all([
            getReferralInfo(currentUser.uid),
            getToolUsageInfo(currentUser.uid)
          ]);
          
          setReferralInfo(referralData);
          setToolUsageInfo(toolData);
        } catch (error) {
          console.error('Error loading user info:', error);
        }
      }
    };

    loadUserInfo();
  }, [currentUser]);

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-light">Profile</h1>
        <p className="text-light/80 mt-2">View your account information below.</p>
      </div>
      
      <div className="bg-secondary p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-light">Account Details</h2>
        {currentUser ? (
           <div className="space-y-3">
                 {currentUser.displayName && (
                    <p className="text-light/90">
                        <strong className="font-medium text-light">Full Name:</strong> {currentUser.displayName}
                    </p>
                )}
                <p className="text-light/90">
                    <strong className="font-medium text-light">Email:</strong> {currentUser.email}
                </p>
                <p className="text-light/90">
                    <strong className="font-medium text-light">User ID:</strong> <span className="text-xs font-mono">{currentUser.uid}</span>
                </p>
           </div>
        ) : (
            <p className="text-light/70">Could not load user information.</p>
        )}
      </div>

      {/* Referral Stats */}
      {referralInfo && (
        <div className="bg-secondary p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-light">Referral Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/40 border border-secondary/50">
              <p className="text-light/80 text-sm">Total Referrals</p>
              <p className="text-2xl font-bold">{referralInfo.referralsCount}</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/40 border border-secondary/50">
              <p className="text-light/80 text-sm">Rewards Points</p>
              <p className="text-2xl font-bold">{referralInfo.rewards}</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/40 border border-secondary/50">
              <p className="text-light/80 text-sm">Referral Code</p>
              <p className="text-xl font-mono">{referralInfo.referralCode}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tool Usage Stats */}
      {toolUsageInfo && (
        <div className="bg-secondary p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-light">Tool Usage Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/40 border border-secondary/50">
              <p className="text-light/80 text-sm">Total Tools Used</p>
              <p className="text-2xl font-bold">{toolUsageInfo.totalUsage}</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/40 border border-secondary/50">
              <p className="text-light/80 text-sm">Unique Tools</p>
              <p className="text-2xl font-bold">{Object.keys(toolUsageInfo.categoryBreakdown).length}</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/40 border border-secondary/50">
              <p className="text-light/80 text-sm">Tool Level</p>
              <p className="text-2xl font-bold">{toolUsageInfo.level}</p>
            </div>
          </div>
          
          {/* Category Breakdown */}
          {Object.keys(toolUsageInfo.categoryBreakdown).length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-light">Usage by Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(toolUsageInfo.categoryBreakdown).map(([category, count]) => (
                  <div key={category} className="p-3 rounded bg-gradient-to-br from-primary/30 to-secondary/40 border border-secondary/50">
                    <p className="text-light/80 text-sm">{category}</p>
                    <p className="text-lg font-bold">{count} uses</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

              {/* Badges and Achievements */}
        {(referralInfo || toolUsageInfo) && (
          <BadgesDisplay 
            badges={referralInfo?.badges || []}
            toolBadges={toolUsageInfo?.badges || []}
            level={referralInfo?.level || 'Bronze'}
            nextLevelPoints={referralInfo?.nextLevelPoints || 0}
            toolLevel={toolUsageInfo?.level}
            nextLevelTools={toolUsageInfo?.nextLevelTools || 0}
            totalUsage={toolUsageInfo?.totalUsage || 0}
            categoryBreakdown={toolUsageInfo?.categoryBreakdown || {}}
          />
        )}


    </div>
  );
};

export default ProfilePage;