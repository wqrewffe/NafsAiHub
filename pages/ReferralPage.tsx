import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getReferralInfo, getReferralUrl } from '../services/referralService';
import { useCongratulations } from '../hooks/CongratulationsProvider';
import { FirestoreUser } from '../types';
import { CheckCircleIcon, ShareIcon, GiftIcon, TrophyIcon, ClockIcon, UserPlusIcon } from '../tools/Icons';

const BONUS_DISMISS_KEY = 'referral_bonus_dismissed';

const ReferralPage: React.FC = () => {
	const { currentUser } = useAuth();
	const { checkForAchievements } = useCongratulations();
	const [referralInfo, setReferralInfo] = useState<NonNullable<FirestoreUser['referralInfo']> | null>(null);
	const [copied, setCopied] = useState(false);
	const [bonusDismissed, setBonusDismissed] = useState<boolean>(() => {
		try { return localStorage.getItem(BONUS_DISMISS_KEY) === '1'; } catch { return false; }
	});
	const [timeLeft, setTimeLeft] = useState<string>('');

	useEffect(() => {
		const loadReferralInfo = async () => {
			if (currentUser) {
				const info = await getReferralInfo(currentUser.uid);
				setReferralInfo(info);
				
				// Check for achievements after loading referral info
				setTimeout(() => {
					checkForAchievements();
				}, 500);
			}
		};
		loadReferralInfo();
	}, [currentUser, checkForAchievements]);

	useEffect(() => {
		const updateCountdown = () => {
			const now = new Date();
			const day = now.getDay();
			const diffToSunday = (7 - day) % 7;
			const end = new Date(now);
			end.setDate(now.getDate() + diffToSunday);
			end.setHours(23, 59, 59, 999);
			const ms = end.getTime() - now.getTime();
			if (ms <= 0) { setTimeLeft('0h 0m'); return; }
			const h = Math.floor(ms / (1000 * 60 * 60));
			const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
			setTimeLeft(`${h}h ${m}m`);
		};
		updateCountdown();
		const id = setInterval(updateCountdown, 60 * 1000);
		return () => clearInterval(id);
	}, []);

	const shareUrl = useMemo(() => referralInfo ? getReferralUrl(referralInfo.referralCode) : '', [referralInfo]);
	const shareText = `I'm using Naf's AI Hub. Join with my link and we both earn rewards: ${shareUrl}`;

	const handleCopyLink = async () => {
		if (referralInfo) {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleWebShare = async () => {
		try {
			// @ts-ignore
			if (navigator.share) {
				// @ts-ignore
				await navigator.share({ title: "Naf's AI Hub", text: shareText, url: shareUrl });
			} else {
				handleCopyLink();
			}
		} catch {}
	};

	const openShare = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

	const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
	const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
	const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
	const mailtoUrl = `mailto:?subject=${encodeURIComponent("Join me on Naf's AI Hub")}&body=${encodeURIComponent(shareText)}`;

	const nextMilestones = [5, 10, 25, 50, 100, 200];
	const milestones = useMemo(() => {
		const count = referralInfo?.referralsCount ?? 0;
		const rewards = referralInfo?.rewards ?? 0;
		return nextMilestones.map((m) => {
			const progress = Math.max(0, Math.min(1, count / m));
			const remaining = Math.max(0, m - count);
			return { target: m, progress, remaining, potential: rewards + remaining * 100 };
		});
	}, [referralInfo]);

	if (!referralInfo) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
			</div>
		);
	}

	const nextLevelMin = referralInfo.referralsCount + (referralInfo.nextLevelPoints || 0);
	const levelProgress = nextLevelMin > 0 ? Math.min(1, referralInfo.referralsCount / nextLevelMin) : 1;

	return (
		<div className="max-w-4xl mx-auto px-4 py-8">
			<div className="space-y-8">
				{/* Bonus Banner */}
				{!bonusDismissed && (
					<div className="rounded-xl border border-amber-400/20 bg-gradient-to-r from-amber-900/30 to-slate-900/40 p-4 md:p-5 shadow-lg shadow-amber-500/10 flex items-start md:items-center justify-between gap-4">
						<div className="flex items-start gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/15 border border-amber-400/30">
								<GiftIcon className="w-5 h-5 text-amber-300" />
							</div>
							<div>
								<p className="font-semibold text-amber-200">Limited-time bonus</p>
								<p className="text-sm text-slate-300/90">Invite 2 friends this week and earn an extra <span className="text-amber-300 font-semibold">+200 points</span>. Ends in <span className="font-semibold">{timeLeft}</span>.</p>
							</div>
						</div>
						<button
							onClick={() => { try { localStorage.setItem(BONUS_DISMISS_KEY, '1'); } catch {}; setBonusDismissed(true); }}
							className="text-slate-400 hover:text-slate-200 text-sm"
						>
							Dismiss
						</button>
					</div>
				)}

				{/* Header */}
				<div>
					<h1 className="text-3xl font-bold">Refer Friends & Earn Rewards</h1>
					<p className="text-slate-400 mt-2">Share your unique referral link with friends. When they sign up, you'll both earn rewards!</p>
				</div>

				{/* Level Progress */}
				<div className="rounded-xl border border-primary/20 bg-gradient-to-r from-slate-800/80 to-slate-700/60 p-5">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-lg font-semibold flex items-center gap-2"><TrophyIcon className="w-5 h-5 text-primary" /> {referralInfo.level} Level</h3>
						<span className="text-xs text-slate-400 flex items-center gap-1"><ClockIcon className="w-4 h-4" /> {referralInfo.nextLevelPoints > 0 ? `${referralInfo.nextLevelPoints} to next level` : 'Max level reached'}</span>
					</div>
					<div className="w-full bg-gray-700/70 rounded-full h-2 overflow-hidden">
						<div className="bg-gradient-to-r from-primary to-cyan-400 h-2 rounded-full transition-all" style={{ width: `${Math.round(levelProgress * 100)}%` }} />
					</div>
				</div>

				{/* Referral Stats */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="bg-secondary p-6 rounded-lg">
						<h3 className="text-lg font-semibold mb-2">Total Referrals</h3>
						<p className="text-3xl font-bold">{referralInfo.referralsCount}</p>
					</div>
					<div className="bg-secondary p-6 rounded-lg">
						<h3 className="text-lg font-semibold mb-2">Rewards Earned</h3>
						<p className="text-3xl font-bold">{referralInfo.rewards} points</p>
					</div>
					<div className="bg-secondary p-6 rounded-lg">
						<h3 className="text-lg font-semibold mb-2">Referral Code</h3>
						<p className="text-3xl font-bold font-mono">{referralInfo.referralCode}</p>
					</div>
				</div>

				{/* Gentle Social Proof & Milestones */}
				<div className="bg-secondary p-6 rounded-lg">
					<h2 className="text-xl font-semibold mb-4">You're closer than you think</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{milestones.slice(0,3).map((m) => (
							<div key={m.target} className="bg-gray-800/70 border border-white/5 rounded-lg p-4">
								<div className="flex items-center justify-between mb-2">
									<span className="font-semibold">{m.target} referrals</span>
									<span className="text-xs text-slate-400">{Math.round(m.progress*100)}%</span>
								</div>
								<div className="w-full bg-gray-700/70 rounded-full h-2 overflow-hidden mb-2">
									<div className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-2 rounded-full" style={{ width: `${Math.round(m.progress*100)}%` }} />
								</div>
								<p className="text-xs text-slate-400">Only <span className="text-slate-200 font-medium">{m.remaining}</span> to go. Earn ~<span className="text-slate-200 font-medium">+{m.remaining*100}</span> points.</p>
							</div>
						))}
					</div>
				</div>

				{/* Share Your Link */}
				<div className="bg-secondary p-6 rounded-lg">
					<h2 className="text-xl font-semibold mb-4">Share Your Referral Link</h2>
					<div className="flex flex-col md:flex-row gap-4">
						<input
							type="text"
							readOnly
							value={shareUrl}
							className="flex-1 bg-gray-700 rounded px-4 py-2 font-mono text-sm"
						/>
						<div className="flex flex-wrap gap-2">
							<button onClick={handleWebShare} className="bg-primary/90 text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors flex items-center gap-2">
								<UserPlusIcon className="w-5 h-5" /> Share
							</button>
							<button onClick={() => openShare(whatsappUrl)} className="bg-green-600/90 text-white px-3 py-2 rounded hover:opacity-90 transition">WhatsApp</button>
							<button onClick={() => openShare(twitterUrl)} className="bg-sky-600/90 text-white px-3 py-2 rounded hover:opacity-90 transition">X</button>
							<button onClick={() => openShare(facebookUrl)} className="bg-blue-700/90 text-white px-3 py-2 rounded hover:opacity-90 transition">Facebook</button>
							<button onClick={() => openShare(mailtoUrl)} className="bg-gray-600/90 text-white px-3 py-2 rounded hover:opacity-90 transition">Email</button>
							<button
								onClick={handleCopyLink}
								className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
							>
								{copied ? (<><CheckCircleIcon className="w-5 h-5" /> Copied</>) : (<><ShareIcon className="w-5 h-5" /> Copy</>)}
							</button>
						</div>
					</div>
					<p className="text-xs text-slate-400 mt-2">Tip: A short personal note works best. Try: "This helped me get organized. Join with my link and we both get rewards!"</p>
				</div>

				{/* Referral History */}
				{referralInfo.referralHistory.length > 0 && (
					<div className="bg-secondary p-6 rounded-lg">
						<h2 className="text-xl font-semibold mb-4">Referral History</h2>
						<div className="space-y-4">
							{referralInfo.referralHistory.map((history, index) => (
								<div
									key={index}
									className="flex items-center justify-between p-4 bg-gray-700 rounded"
								>
									<div>
										<p className="font-medium">{history.referredUserEmail}</p>
										<p className="text-sm text-slate-400">{new Date(history.timestamp).toLocaleDateString()}</p>
									</div>
									<div className="text-green-400">+100 points</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default ReferralPage;
