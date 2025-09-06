import React, { useEffect, useMemo, useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { db } from '../../firebase/config.ts';
import { TRAINER_MODES, TrainerModeMeta } from '../modes.ts';


type LeaderboardRow = {
	id: string;
	userId?: string | null;
	userName: string;
	mode: string;
	score: number;
	createdAt?: any;
};

const formatDate = (ts: any) => {
	try {
		if (!ts) return '';
		const d = ts.toDate ? ts.toDate() : new Date(ts);
		return d.toLocaleString();
	} catch {
		return '';
	}
};

const Leaderboard: React.FC = () => {
	const [modeFilter, setModeFilter] = useState<string>('all');
	const [rows, setRows] = useState<LeaderboardRow[]>([]);
	const [loading, setLoading] = useState(true);

	// build a map of mode slug -> friendly title
	const modeOptions = useMemo(() => {
		const opts: { slug: string; title: string }[] = [{ slug: 'all', title: 'All Modes' }];
		Object.entries(TRAINER_MODES).forEach(([slug, meta]) => {
				const m = meta as TrainerModeMeta;
				opts.push({ slug, title: m.title });
			});
		return opts;
	}, []);

	useEffect(() => {
		setLoading(true);

			// Fetch recent trainerResults and do filtering + sorting client-side.
			// This avoids mismatches when some code saved mode as camelCase vs kebab-case.
			const q = db.collection('trainerResults').limit(500) as any;

			const normalizeMode = (raw: any) => {
				if (!raw) return 'unknown';
				let s = String(raw);
				// convert camelCase to kebab-case: insert hyphen before capitals
				s = s.replace(/([a-z0-9])([A-Z])/g, '$1-$2');
				// replace spaces/underscores with hyphens
				s = s.replace(/[ _]+/g, '-');
				return s.toLowerCase();
			};

			const unsubscribe = q.onSnapshot(async (snap: any) => {
				const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as any));

			// Collect userIds to resolve display names (avoid duplicate reads)
			const userIds = Array.from(new Set(docs.map((r: any) => r.userId).filter(Boolean))).map(String) as string[];

			const userMap: Record<string, string> = {};
			if (userIds.length > 0) {
				try {
					// Batch get user docs
					const promises = userIds.map(uid => db.collection('users').doc(uid).get());
					const results = await Promise.all(promises);
					results.forEach(res => {
						if (res.exists) {
							const data = res.data();
							userMap[res.id] = (data && (data.displayName || data.name || data.email)) || `User-${res.id.substring(0,6)}`;
						}
					});
				} catch (err) {
					// ignore user lookup failures
					// eslint-disable-next-line no-console
					console.warn('Failed to fetch user names for leaderboard', err);
				}
			}

					let processed: LeaderboardRow[] = docs.map((d: any) => {
						const score = d?.stats?.finalScore ?? 0;
						const userId = d.userId ?? null;
						const userName = userId ? (userMap[userId] || `User-${userId.substring(0,6)}`) : 'Anonymous';
						const normalized = normalizeMode(d.mode);
						return {
							id: d.id,
							userId,
							userName,
							mode: normalized,
							score,
							createdAt: d.createdAt,
						};
					});

							// client-side filter by selected mode
							if (modeFilter !== 'all') {
								processed = processed.filter(p => p.mode === modeFilter);
							}

							// Group by user+mode and keep the highest score per user per mode
							const bestMap: Record<string, LeaderboardRow> = {};
							processed.forEach(p => {
								// Use userId when available, otherwise use userName as identifier
								const userKey = p.userId ? p.userId : p.userName;
								const key = `${userKey}||${p.mode}`;
								const existing = bestMap[key];
								if (!existing) {
									bestMap[key] = p;
								} else {
									if ((p.score || 0) > (existing.score || 0)) {
										bestMap[key] = p;
									} else if ((p.score || 0) === (existing.score || 0)) {
										// tie-breaker: keep most recent
										const ta = p.createdAt && p.createdAt.toDate ? p.createdAt.toDate().getTime() : 0;
										const tb = existing.createdAt && existing.createdAt.toDate ? existing.createdAt.toDate().getTime() : 0;
										if (ta > tb) bestMap[key] = p;
									}
								}
							});

							let bestList = Object.values(bestMap);

							// sort by score desc then recent
							bestList.sort((a, b) => {
								if (b.score !== a.score) return b.score - a.score;
								const ta = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
								const tb = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
								return tb - ta;
							});

							// limit to top 100
							bestList = bestList.slice(0, 100);

							setRows(bestList);
			setLoading(false);
		}, (err) => {
			// eslint-disable-next-line no-console
			console.error('Leaderboard listener error', err);
			setLoading(false);
		});

		return () => unsubscribe();
	}, [modeFilter]);

	return (
		<div className="mt-8 w-full bg-gray-800 border border-gray-700 rounded-lg p-4">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-xl font-semibold text-white">Leaderboard</h3>
				<div className="flex items-center gap-2">
					<label className="text-gray-300 text-sm">Mode</label>
					<select
						aria-label="Select trainer mode for leaderboard"
						className="bg-gray-700 text-white rounded px-2 py-1"
						value={modeFilter}
						onChange={(e) => setModeFilter(e.target.value)}
					>
						{modeOptions.map(o => (
							<option key={o.slug} value={o.slug}>{o.title}</option>
						))}
					</select>
				</div>
			</div>

			{loading ? (
				<div className="text-gray-400">Loading leaderboard…</div>
			) : rows.length === 0 ? (
				<div className="text-gray-400">No results yet.</div>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full text-left text-sm">
						<thead>
							<tr className="text-gray-400 border-b border-gray-700">
								<th className="py-2">#</th>
								<th className="py-2">Player</th>
								<th className="py-2">Mode</th>
								<th className="py-2">Score</th>
								<th className="py-2">When</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((r, idx) => (
								<tr key={r.id} className="border-b border-gray-800">
									<td className="py-2 text-gray-300 w-8">{idx + 1}</td>
									<td className="py-2 text-white">{r.userName}</td>
									<td className="py-2 text-cyan-300">{TRAINER_MODES[r.mode]?.title || r.mode}</td>
									<td className="py-2 text-yellow-300 font-mono">{r.score}</td>
									<td className="py-2 text-gray-400">{formatDate(r.createdAt)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
};

export default Leaderboard;
