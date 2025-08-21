import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getReferralInfo } from '../services/referralService';
import { getToolUsageInfo, ToolUsageInfo } from '../services/toolUsageService';
import { ReferralInfo } from '../types';
import { TrophyIcon, CheckBadgeIcon, SparklesIcon, FireIcon } from '../tools/Icons';

interface ProgressItem {
  title: string;
  description: string;
  progressPct: number;
}

const referralBadgeRequirements = [
  { type: 'Newcomer', name: 'Newcomer', need: 0, description: 'Welcome to the community!' },
  { type: 'Influencer', name: 'Rising Influencer', need: 5, description: 'Refer 5 users' },
  { type: 'NetworkMaster', name: 'Network Master', need: 10, description: 'Refer 10 users' },
  { type: 'CommunityLeader', name: 'Community Leader', need: 25, description: 'Refer 25 users' },
  { type: 'ReferralLegend', name: 'Referral Legend', need: 50, description: 'Refer 50 users' },
  { type: 'SuperConnector', name: 'Super Connector', need: 100, description: 'Refer 100 users' },
  { type: 'Ultimate Networker', name: 'Ultimate Networker', need: 200, description: 'Refer 200 users' },
];

const toolBadgeRequirements = [
  { key: 'DailyExplorer', name: 'Daily Explorer', description: 'Use tools for 5 consecutive days', progress: (u: ToolUsageInfo) => Math.min(u.dayStreak / 5, 1) },
  { key: 'WeeklyChampion', name: 'Weekly Champion', description: 'Use tools every day for a week', progress: (u: ToolUsageInfo) => Math.min(u.dayStreak / 7, 1) },
  { key: 'ConsistentLearner', name: 'Consistent Learner', description: 'Use tools daily for a month', progress: (u: ToolUsageInfo) => Math.min(u.dayStreak / 30, 1) },
  { key: 'AIDevotee', name: 'AI Devotee', description: 'Use tools daily for 90 days', progress: (u: ToolUsageInfo) => Math.min(u.dayStreak / 90, 1) },
  { key: 'AIApprentice', name: 'AI Apprentice', description: 'Use 8 different tools', progress: (u: ToolUsageInfo) => Math.min(u.totalTools / 8, 1) },
  { key: 'ToolCollector', name: 'Tool Collector', description: 'Use 20 different tools', progress: (u: ToolUsageInfo) => Math.min(u.totalTools / 20, 1) },
  { key: 'InnovationSeeker', name: 'Innovation Seeker', description: 'Use 35 different tools', progress: (u: ToolUsageInfo) => Math.min(u.totalTools / 35, 1) },
  { key: 'AIVirtuoso', name: 'AI Virtuoso', description: 'Use 50 different tools', progress: (u: ToolUsageInfo) => Math.min(u.totalTools / 50, 1) },
  { key: 'TechPioneer', name: 'Tech Pioneer', description: 'Use 70 different tools', progress: (u: ToolUsageInfo) => Math.min(u.totalTools / 70, 1) },
  { key: 'AIVanguard', name: 'AI Vanguard', description: 'Use 85 different tools', progress: (u: ToolUsageInfo) => Math.min(u.totalTools / 85, 1) },
  { key: 'ToolOptimizer', name: 'Tool Optimizer', description: 'Use a single tool 50 times', progress: (u: ToolUsageInfo) => Math.min(u.maxToolUses / 50, 1) },
];

const BadgeCard: React.FC<{ title: string; description: string; imageUrl?: string; unlockedAt?: string; progressPct?: number; }>
= ({ title, description, imageUrl, unlockedAt, progressPct }) => {
  return (
    <div className="group relative bg-gray-800/70 border border-white/10 p-4 rounded-xl hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1">
      <div className="absolute inset-0 rounded-xl pointer-events-none bg-gradient-to-tr from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      {imageUrl && (
        <img src={imageUrl} alt={title} className="w-16 h-16 mb-2 drop-shadow" />
      )}
      <h3 className="font-semibold text-slate-100">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
      {unlockedAt && (
        <p className="text-xs text-slate-400 mt-1">Unlocked: <span className="text-slate-200">{new Date(unlockedAt).toLocaleDateString()}</span></p>
      )}
      {progressPct !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-gray-700/70 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-cyan-400 h-2 rounded-full transition-all duration-700" style={{ width: `${Math.round(progressPct * 100)}%` }} />
          </div>
          <p className="text-xs text-slate-300 mt-1">{Math.round(progressPct * 100)}%</p>
        </div>
      )}
    </div>
  );
};

const BadgesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [toolUsageInfo, setToolUsageInfo] = useState<ToolUsageInfo | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      const [r, t] = await Promise.all([
        getReferralInfo(currentUser.uid),
        getToolUsageInfo(currentUser.uid)
      ]);
      setReferralInfo(r);
      setToolUsageInfo(t);
    };
    load();
  }, [currentUser]);

  // Build referral progress list
  const referralProgress: ProgressItem[] = referralBadgeRequirements.map(rb => {
    const have = referralInfo?.referralsCount ?? 0;
    const pct = rb.need === 0 ? 1 : Math.max(0, Math.min(1, have / rb.need));
    return {
      title: rb.name,
      description: `${rb.description} (${have}/${rb.need})`,
      progressPct: pct
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-light"><SparklesIcon className="w-6 h-6 text-accent" /> All Badges & Progress</h1>
          <p className="text-light/80 mt-2">See how to earn every badge and track your progress.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs bg-secondary/30 text-light border border-secondary/50 px-3 py-1 rounded-full">
          <CheckBadgeIcon className="w-4 h-4" /> Gamified journey
        </div>
      </div>

      {/* Referral Badges */}
      <section className="space-y-4 rounded-xl border border-secondary/40 bg-gradient-to-r from-primary/30 to-secondary/40 p-6 shadow-lg shadow-accent/10">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-light"><CheckBadgeIcon className="w-5 h-5 text-accent" /> Referral Badges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {referralProgress.map((p, idx) => (
            <BadgeCard key={idx} title={p.title} description={p.description} progressPct={p.progressPct} />
          ))}
        </div>
      </section>

      {/* Tool Usage Badges */}
      <section className="space-y-4 rounded-xl border border-secondary/40 bg-gradient-to-r from-primary/30 to-secondary/40 p-6 shadow-lg shadow-accent/10">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-light"><TrophyIcon className="w-5 h-5 text-accent" /> Tool Usage Badges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {toolBadgeRequirements.map((tb, idx) => {
            const pct = toolUsageInfo ? tb.progress(toolUsageInfo) : 0;
            return (
              <BadgeCard key={idx} title={tb.name} description={tb.description} progressPct={pct} />
            );
          })}
        </div>
      </section>

      {/* Unlocked Badges overview */}
      <section className="space-y-4 rounded-xl border border-secondary/40 bg-gradient-to-r from-primary/30 to-secondary/40 p-6 shadow-lg shadow-accent/10">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-light"><FireIcon className="w-5 h-5 text-accent" /> Unlocked Badges</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(referralInfo?.badges || []).map((b, i) => (
            <BadgeCard key={`r-${i}`} title={b.name} description={b.description} imageUrl={b.imageUrl} unlockedAt={b.unlockedAt} />
          ))}
          {(toolUsageInfo?.badges || []).map((b, i) => (
            <BadgeCard key={`t-${i}`} title={b.name} description={b.description} imageUrl={b.imageUrl} unlockedAt={b.unlockedAt} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default BadgesPage;
