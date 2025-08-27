import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase/config';
import { joinCompetition, submitCompetitionScore, registerForCompetition, onRegistrationsSnapshot, verifyRegistration, startAttempt } from '../services/quizService';
const ADMIN_EMAIL = 'nafisabdullah424@gmail.com';
import UserProfileLink from './UserProfileLink';

// Lightweight competition page: fetch competition by id, show countdown, allow join, and run quiz
export default function CompetitionPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [competition, setCompetition] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [scores, setScores] = useState<any[]>([]);
  const [scoresLoading, setScoresLoading] = useState(true);
  const [startedForUser, setStartedForUser] = useState(false);
  const [now, setNow] = useState<number>(Date.now());
  const [paymentTxn, setPaymentTxn] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [fbProfile, setFbProfile] = useState('');
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(true);
  const [showRegModal, setShowRegModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    const ref = db.collection('competitions').doc(id);
    const unsub = ref.onSnapshot(async doc => {
      if (!doc.exists) {
        setCompetition(null);
        setLoading(false);
        return;
      }
      const data: any = { id: doc.id, ...doc.data() };
      // if quizId present but quiz missing, fetch it
      if (data.quizId && !data.quiz) {
        const qdoc = await db.collection('quizzes').doc(String(data.quizId)).get();
        if (qdoc.exists) data.quiz = { id: qdoc.id, ...qdoc.data() };
      }
      setCompetition(data);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, [id]);

  // subscribe to scores for leaderboard/statistics
  useEffect(() => {
    if (!id) return;
    setScoresLoading(true);
  // Order only by score on the server to avoid requiring a composite index; full ordering (score desc, time asc) is done client-side in displayScores
  const scoresRef = db.collection('competitions').doc(id).collection('scores').orderBy('score', 'desc');
    const unsubScores = scoresRef.onSnapshot(snapshot => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setScores(items as any[]);
      setScoresLoading(false);
    }, err => {
      console.error('Failed to subscribe to scores', err);
      setScoresLoading(false);
    });
    return () => unsubScores && unsubScores();
  }, [id]);

  // subscribe to registrations (organizer view)
  useEffect(() => {
    if (!id) return;
    setRegistrationsLoading(true);
    const unsub = onRegistrationsSnapshot(id, items => {
      setRegistrations(items);
      setRegistrationsLoading(false);
    });
    return () => unsub && unsub();
  }, [id]);

  // live timer to auto-update starts/ends calculations so UI shows Join when it reaches 0
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // update joined state when competition or user changes
  useEffect(() => {
    if (!competition || !currentUser) return;
    const isJoined = Boolean((competition.participants || []).find((p: any) => p.userId === currentUser.uid));
    setJoined(isJoined);
  }, [competition, currentUser]);

  // use live `now` so page updates automatically when competition begins
  const startsIn = competition ? new Date(competition.startAt).getTime() - now : 0;
  const endsIn = competition ? new Date(competition.endAt).getTime() - now : 0;
  const regEndsIn = competition && competition.registrationEndsAt ? new Date(competition.registrationEndsAt).getTime() - now : null;
  const registrationOpen = regEndsIn == null ? true : regEndsIn > 0;

  const hasSubmitted = Boolean(currentUser && scores.find(s => s.userId === currentUser.uid));
  const myRegistration = currentUser ? registrations.find(r => r.userId === currentUser.uid) : null;

  // Build a lookup map for userId -> display name using available sources
  const nameMap = useMemo(() => {
    const map = new Map<string, string>();
    // prefer names from competition participants
    if (competition && competition.participants) {
      (competition.participants || []).forEach((p: any) => {
        if (p && p.userId) map.set(p.userId, p.name || map.get(p.userId) || 'Anonymous');
      });
    }
    // names from registrations
    (registrations || []).forEach(r => {
      if (r && r.userId) map.set(r.userId, r.name || map.get(r.userId) || 'Anonymous');
    });
    // names from scores (most authoritative)
    (scores || []).forEach(s => {
      if (s && s.userId && s.name) map.set(s.userId, s.name);
    });
    return map;
  }, [competition, registrations, scores]);

  // fetchedNames: load from `users` collection for any userIds not covered by nameMap
  const [fetchedNames, setFetchedNames] = React.useState<Record<string, string>>({});
  useEffect(() => {
    // Build list of userIds present in scores
    const scoreIds = (scores || []).map((s: any) => s && s.userId).filter(Boolean) as string[];
    if (scoreIds.length === 0) return;

    (async () => {
      const needFetch: string[] = [];
      const resolved: Record<string, string> = {};

      // try to resolve from score.name, participants, registrations first
      scoreIds.forEach(uid => {
        if (fetchedNames[uid]) return; // already fetched
        const score = (scores || []).find((s: any) => s.userId === uid);
        if (score && score.name) {
          resolved[uid] = score.name;
          return;
        }
        const part = (competition && competition.participants || []).find((p: any) => p.userId === uid);
        if (part && part.name) {
          resolved[uid] = part.name;
          return;
        }
        const reg = (registrations || []).find((r: any) => r.userId === uid && r.name);
        if (reg && reg.name) {
          resolved[uid] = reg.name;
          return;
        }
        needFetch.push(uid);
      });

      // batch fetch remaining from users collection
      if (needFetch.length > 0) {
        await Promise.all(needFetch.map(async uid => {
          try {
            const doc = await db.collection('users').doc(uid).get();
            if (doc.exists) {
              const data: any = doc.data();
              if (data && data.displayName) resolved[uid] = data.displayName;
            }
          } catch (err) {
            console.error('Failed to fetch user for leaderboard', uid, err);
          }
        }));
      }

      if (Object.keys(resolved).length > 0) setFetchedNames(prev => ({ ...prev, ...resolved }));
    })();
  }, [scores, competition, registrations]);

  // Prepare display scores: compute timestamp/date, time since competition start (ms), sort by score desc then time asc, limit to top 15
  const displayScores = useMemo(() => {
    if (!scores) return [] as any[];
    const startMs = competition && competition.startAt ? new Date(competition.startAt).getTime() : null;
    const enriched = scores.map(s => {
      const ts = s.timestamp && (s.timestamp.toDate ? s.timestamp.toDate() : new Date(s.timestamp));
      // prefer server-persisted elapsedMs, fallback to computed time from timestamp - start
      const timeMs = (typeof s.elapsedMs === 'number') ? s.elapsedMs : (ts && startMs ? Math.max(0, ts.getTime() - startMs) : undefined);
      return { ...s, _ts: ts, _timeMs: timeMs };
    });
    enriched.sort((a: any, b: any) => {
      // primary: score desc
      const sa = (a.score || 0);
      const sb = (b.score || 0);
      if (sb !== sa) return sb - sa;
      // secondary: time asc (undefined -> Infinity)
      const ta = a._timeMs == null ? Number.POSITIVE_INFINITY : a._timeMs;
      const tb = b._timeMs == null ? Number.POSITIVE_INFINITY : b._timeMs;
      if (ta !== tb) return ta - tb;
      // tertiary: timestamp asc
      const tsa = a._ts ? a._ts.getTime() : Number.POSITIVE_INFINITY;
      const tsb = b._ts ? b._ts.getTime() : Number.POSITIVE_INFINITY;
      return tsa - tsb;
    });
    return enriched.slice(0, 15);
  }, [scores, competition]);

  const formatDuration = (ms?: number) => {
    if (ms == null) return '-';
    const totalSec = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) return `${hrs}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
    if (mins > 0) return `${mins}m ${String(secs).padStart(2, '0')}s`;
    return `${secs}s`;
  };

  const register = async () => {
  if (!currentUser || !competition) return alert('Please sign in to register');
  // organizers cannot register or participate in their own competition
  if (currentUser.uid === competition.quiz?.organizerId) return alert('Organizers cannot register for their own competition');
    try {
      // if competition is paid, open registration modal to collect txn and phone
      // ensure registration window not passed
      if (competition.registrationEndsAt) {
        const regEnds = new Date(competition.registrationEndsAt).getTime();
        if (Date.now() > regEnds) return alert('Registration period has ended');
      }
      // show registration modal for both paid and free (we require FB profile for both)
  setShowRegModal(true);
      return;
    } catch (err) {
      console.error(err);
      alert('Failed to register');
    }
  };

  const submitRegistrationFromModal = async () => {
    if (!currentUser || !competition) return alert('Please sign in to register');
    if (!fbProfile) return alert('Please provide your Facebook profile URL');
    try {
      if (competition.isPaid) {
        if (!paymentTxn || !payerPhone) return alert('Please provide payment transaction id and phone number used');
        await registerForCompetition(competition.id, { userId: currentUser.uid, name: currentUser.displayName || currentUser.email || 'Anonymous', paymentTxn, payerPhone, fbProfile });
      } else {
        // free: registration will auto-verify in service
        await registerForCompetition(competition.id, { userId: currentUser.uid, name: currentUser.displayName || currentUser.email || 'Anonymous', fbProfile });
      }
      alert('Registration submitted. Waiting for organizer verification.');
      setShowRegModal(false);
      setPaymentTxn(''); setPayerPhone(''); setFbProfile('');
    } catch (err) {
      console.error(err);
      alert('Failed to submit registration');
    }
  };

  if (loading) return <div className="p-4">Loading competition...</div>;
  if (!competition) return <div className="p-4">Competition not found.</div>;

  // If competition is hidden, block access unless current user is admin or organizer
  const isAdmin = currentUser?.email === ADMIN_EMAIL;
  const isOrganizer = currentUser && competition && competition.quiz?.organizerId === currentUser.uid;
  if (competition.visible === false && !isAdmin && !isOrganizer) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold">Competition hidden</h2>
        <p className="text-sm text-slate-400">This competition has been hidden by an administrator and is not available for participation.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-primary p-4 sm:p-6 rounded w-full max-w-md sm:max-w-lg">
            {competition?.isPaid ? (
              <>
                <h3 className="text-lg font-bold mb-2">Paid Registration</h3>
                <p className="text-sm text-slate-400 mb-3">Send the amount below to the organizer and enter the payment transaction id and the phone number you used for the payment.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs text-slate-400">Amount</label>
                    <div className="p-2 bg-secondary rounded mt-1 font-semibold">{competition.fee ? `${competition.fee} ` : 'N/A'}</div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Organizer Phone</label>
                    <div className="p-2 bg-secondary rounded mt-1">{competition.organizerPhone || 'N/A'}</div>
                  </div>
                </div>
                <input value={paymentTxn} onChange={e => setPaymentTxn(e.target.value)} placeholder="Payment transaction id" className="w-full p-2 bg-secondary border rounded mb-2" />
                <input value={payerPhone} onChange={e => setPayerPhone(e.target.value)} placeholder="Phone used for payment" className="w-full p-2 bg-secondary border rounded mb-2" />
                <input value={fbProfile} onChange={e => setFbProfile(e.target.value)} placeholder="Your Facebook profile URL (https://facebook.com/...)" className="w-full p-2 bg-secondary border rounded mb-2" />
                <div className="flex flex-col sm:flex-row gap-2 justify-end">
                  <button onClick={() => setShowRegModal(false)} className="px-3 py-2 rounded border w-full sm:w-auto">Cancel</button>
                  <button onClick={submitRegistrationFromModal} className="bg-accent text-white px-3 py-2 rounded w-full sm:w-auto">Submit</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-2">Registration</h3>
                <p className="text-sm text-slate-400 mb-3">Enter your Facebook profile URL to register for this free competition.</p>
                <input value={fbProfile} onChange={e => setFbProfile(e.target.value)} placeholder="Your Facebook profile URL (https://facebook.com/...)" className="w-full p-2 bg-secondary border rounded mb-2" />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowRegModal(false)} className="px-3 py-2 rounded border">Cancel</button>
                  <button onClick={submitRegistrationFromModal} className="bg-accent text-white px-3 py-2 rounded">Submit</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <h2 className="text-2xl font-bold">{competition.quiz?.title || 'Untitled Competition'}</h2>
      <p className="text-sm text-slate-400">Organizer: {competition.quiz?.organizerId}</p>
      <p className="mt-2">Starts: {new Date(competition.startAt).toLocaleString()}</p>
      <p>Ends: {new Date(competition.endAt).toLocaleString()}</p>

      <div className="mt-4">
        {startsIn > 0 && <Countdown ms={startsIn} label="Starts in" />}
        {startsIn <= 0 && endsIn > 0 && <Countdown ms={endsIn} label="Ends in" />}
        {endsIn <= 0 && <div className="text-sm text-slate-400">This competition has ended.</div>}
      </div>

      <div className="mt-4">
  {!joined && startsIn > 0 && registrationOpen && currentUser?.uid !== competition.quiz?.organizerId && <button onClick={register} className="bg-accent text-white px-4 py-2 rounded">Register</button>}
        {!joined && startsIn > 0 && !registrationOpen && <div className="text-sm text-slate-400">Registration closed</div>}
        {/* show current user's registration status */}
        {currentUser && myRegistration && myRegistration.verified && regEndsIn != null && regEndsIn <= 0 && (
          <div className="mt-2 text-sm text-green-400">Registration period has ended. registration completed</div>
        )}
        {currentUser && myRegistration && myRegistration.verified && (regEndsIn == null || regEndsIn > 0) && (
          <div className="mt-2 text-sm text-green-400">Registration completed</div>
        )}
        {currentUser && myRegistration && !myRegistration.verified && (
          <div className="mt-2 text-sm text-yellow-400">Registration pending verification</div>
        )}
  {(!joined && startsIn <= 0 && endsIn > 0 && currentUser?.uid !== competition.quiz?.organizerId) && <button onClick={register} className="bg-accent text-white px-4 py-2 rounded">Join Now</button>}
        {competition?.registrationEndsAt && regEndsIn != null && regEndsIn > 0 && (
          <div className="mt-2 text-sm text-slate-400"><Countdown ms={regEndsIn} label="Registration ends in" /></div>
        )}
        {competition?.registrationEndsAt && regEndsIn != null && regEndsIn <= 0 && (
          <div className="mt-2 text-sm text-slate-400">Registration period has ended.</div>
        )}
      </div>

      {/* When competition is active, require the user to click Join to start the quiz for them */}
      {startsIn <= 0 && endsIn > 0 && (
        <div className="mt-6">
          {!currentUser && <div className="text-sm text-slate-400">Please sign in to join the quiz.</div>}

          {currentUser && joined && !startedForUser && !hasSubmitted && (
            <div>
              <p className="text-sm text-slate-400 mb-2">You're registered. Click Join to begin your quiz session.</p>
              <button onClick={async () => {
                try {
                  if (currentUser && competition && competition.id) {
                    await startAttempt(competition.id, currentUser.uid, currentUser.displayName || currentUser.email || 'Anonymous');
                  }
                } catch (err) {
                  console.error('Failed to start attempt', err);
                }
                setStartedForUser(true);
              }} className="bg-accent text-white px-4 py-2 rounded">Join</button>
            </div>
          )}

          {currentUser && hasSubmitted && (
            <div className="text-sm text-slate-400">You have already completed this competition and cannot participate again.</div>
          )}

          {currentUser && joined && startedForUser && !hasSubmitted && (
            <div className="mt-4">
              <CompetitionRunner competition={competition} />
            </div>
          )}
        </div>
      )}

      {/* Organizer: view registrations and verify */}
      {currentUser && competition && competition.quiz?.organizerId === currentUser.uid && (
        <div className="mt-6 bg-primary p-4 rounded">
          <h3 className="font-semibold mb-2">Registrations</h3>
          {registrationsLoading ? <div className="text-slate-400">Loading registrations...</div> : (
            <div className="divide-y divide-gray-700">
              {registrations.map(r => (
                <div key={r.id} className="p-2 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{r.name} ({r.userId})</div>
                    <div className="text-sm text-slate-400">Txn: {r.paymentTxn || '-'} • Phone: {r.payerPhone || '-'}</div>
                    <div className="text-sm text-slate-400">Verified: {r.verified ? 'Yes' : 'No'}</div>
                    {r.fbProfile && (
                      <div className="text-sm mt-1"><a href={r.fbProfile} target="_blank" rel="noreferrer" className="text-blue-400 underline">Facebook profile</a></div>
                    )}
                  </div>
                  {!r.verified && (
                    <div className="flex gap-2">
                      <button onClick={() => verifyRegistration(competition.id, r.id, true)} className="bg-accent text-white px-3 py-1 rounded">Approve</button>
                      <button onClick={() => verifyRegistration(competition.id, r.id, false)} className="px-3 py-1 rounded border">Reject</button>
                    </div>
                  )}
                </div>
              ))}
              {registrations.length === 0 && <div className="p-2 text-slate-400">No registrations yet.</div>}
            </div>
          )}
        </div>
      )}

      {/* After competition ends, show leaderboard and statistics to organizer and verified participants only */}
      {endsIn <= 0 && (() => {
        const isOrganizer = currentUser && competition && competition.quiz?.organizerId === currentUser.uid;
        const isVerifiedParticipant = currentUser && (
          (competition.participants || []).find((p: any) => p.userId === currentUser.uid)
          || (registrations.find((r:any) => r.userId === currentUser.uid && r.verified))
          || (scores.find((s:any) => s.userId === currentUser.uid)) // allow users who submitted a score to view leaderboard
        );
        const canViewLeaderboard = Boolean(isOrganizer || isVerifiedParticipant);

        if (!canViewLeaderboard) {
          return (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-3">Leaderboard & Statistics</h3>
              <div className="text-sm text-slate-400">Leaderboard is visible to the organizer and verified participants only.</div>
            </div>
          );
        }

        return (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-3">Leaderboard & Statistics</h3>
            {scoresLoading ? (
              <div className="text-slate-400">Loading leaderboard...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2">
                  <div className="bg-primary p-4 rounded">
                    {/* Header - hidden on mobile */}
                    <div className="hidden sm:grid p-2 border-b border-gray-700 grid-cols-12 gap-2 sm:gap-4 font-semibold text-sm">
                      <div className="col-span-1">Rank</div>
                      <div className="col-span-6">User</div>
                      <div className="col-span-2">Score</div>
                      <div className="col-span-3">Time</div>
                    </div>

                    <div className="divide-y divide-gray-700">
                      {displayScores.map((s, idx) => {
                        const ts = s._ts;
                        const icon = idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                        return (
                          <div key={s.id} className="p-3 hover:bg-gray-700 transition-colors">
                            {/* Mobile layout */}
                            <div className="sm:hidden flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-semibold text-white">{(s.name || nameMap.get(s.userId) || fetchedNames[s.userId] || 'A').split(' ').map((p:string)=>p[0]).slice(0,2).join('')}</div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{icon}</span>
                                    <UserProfileLink displayName={s.name || nameMap.get(s.userId) || fetchedNames[s.userId] || 'Anonymous'} uid={s.userId} className="font-medium truncate text-light" />
                                  </div>
                                  <div className="text-sm text-slate-400">{formatDuration(s._timeMs)}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-white font-semibold">{s.score}</div>
                              </div>
                            </div>

                            {/* Desktop layout */}
                            <div className="hidden sm:grid grid-cols-12 gap-4 items-center">
                              <div className="col-span-1 font-semibold">{icon}</div>
                              <div className="col-span-6">
                                <div className="flex items-center gap-2">
                                  <UserProfileLink displayName={s.name || nameMap.get(s.userId) || fetchedNames[s.userId] || 'Anonymous'} uid={s.userId} className="font-medium truncate block text-light" />
                                  { (s.fbProfile || (competition.participants || []).find((p:any)=>p.userId===s.userId && p.fbProfile)) && (
                                    <a href={s.fbProfile || ((competition.participants || []).find((p:any)=>p.userId===s.userId) || {}).fbProfile} target="_blank" rel="noreferrer" className="text-blue-400 ml-2" title="Open Facebook profile">🔗</a>
                                  )}
                                </div>
                              </div>
                              <div className="col-span-2">{s.score}</div>
                              <div className="col-span-3 text-sm text-slate-400">{formatDuration(s._timeMs)}</div>
                            </div>
                          </div>
                        );
                      })}
                      {scores.length === 0 && (
                        <div className="p-3 text-slate-400">No submissions yet.</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-span-1">
                  <div className="bg-primary p-4 rounded">
                    <h4 className="font-semibold mb-2">Summary</h4>
                    <StatsView scores={scores} competition={competition} />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function Countdown({ ms, label }: { ms: number; label?: string }) {
  const [left, setLeft] = useState(ms);
  useEffect(() => {
    setLeft(ms);
    const t = setInterval(() => setLeft(prev => Math.max(0, prev - 1000)), 1000);
    return () => clearInterval(t);
  }, [ms]);
  const secs = Math.floor(left / 1000) % 60;
  const mins = Math.floor(left / 1000 / 60) % 60;
  const hours = Math.floor(left / 1000 / 3600);
  return <div className="text-sm font-medium">{label ? `${label}: ` : ''}{hours}h {mins}m {secs}s</div>;
}

// Minimal in-page runner copied from ParticipateQuizCompetition to keep this file standalone
const CompetitionRunner: React.FC<{ competition: any }> = ({ competition }) => {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const { currentUser } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<(string | null)[]>([]);

  useEffect(() => {
    const qs = (competition.quiz?.questions || []).map((q: any) => ({ ...q, shuffledOptions: [...(q.options||[])].sort(() => Math.random() - 0.5) }));
    const shuffled = qs.sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setIndex(0);
    setSelected(null);
    setFinished(false);
    setFinalScore(null);
    setAnswers(new Array(shuffled.length).fill(null));
  }, [competition]);

  // record an answer for the current question; allow navigation regardless
  const handleSelect = (opt: string) => {
    setAnswers(prev => {
      const copy = [...prev];
      copy[index] = opt;
      return copy;
    });
    setSelected(opt);
  };

  const handleNext = async () => {
    const next = index + 1;
    if (next >= questions.length) {
      // finish: compute and submit score
      setFinished(true);
      const computed = answers.reduce((acc, a, i) => acc + ((a && a === questions[i].answer) ? 1 : 0), 0);
      setFinalScore(computed);
      if (currentUser) await submitCompetitionScore(competition.id, { userId: currentUser.uid, name: currentUser.displayName || currentUser.email || 'Anonymous', score: computed });
      return;
    }
    setIndex(next);
    setSelected(answers[next] || null);
  };

  const handlePrev = () => {
    if (index <= 0) return;
    const prev = index - 1;
    setIndex(prev);
    setSelected(answers[prev] || null);
  };

  if (!questions.length) return <div className="p-4">No questions available.</div>;

  return (
    <div className="p-4 bg-secondary rounded">
      {!finished ? (
        <div>
          <div className="font-bold mb-2">{index + 1}. {questions[index].question}</div>
          <div className="grid gap-2">
            {questions[index].shuffledOptions.map((opt: string, idx: number) => (
              <button key={`${opt}-${idx}`} onClick={() => handleSelect(opt)} className={`text-left p-4 rounded text-sm sm:text-base ${selected ? (opt === questions[index].answer ? 'bg-green-600' : (opt === selected ? 'bg-red-600' : 'bg-slate-800 opacity-60')) : 'bg-slate-700 hover:bg-slate-600'}`}>
                {opt}
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-between items-center text-sm text-slate-400">
            <div>Score: <strong className="text-white">{answers.slice(0, index + 1).reduce((acc, a, i) => acc + ((a && a === questions[i].answer) ? 1 : 0), 0)}</strong></div>
            <div />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handlePrev} disabled={index === 0} className="px-4 py-3 rounded border">Prev</button>
            <button onClick={handleNext} className="bg-accent text-white px-4 py-3 rounded w-full sm:w-auto">{index < questions.length - 1 ? 'Next' : 'Finish'}</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="font-bold">Finished</div>
          <div>Your score: <strong>{finalScore ?? answers.reduce((acc, a, i) => acc + ((a && a === questions[i].answer) ? 1 : 0), 0)} / {questions.length}</strong></div>
        </div>
      )}
    </div>
  );
};

function StatsView({ scores, competition }: { scores: any[]; competition: any }) {
  const count = scores.length;
  const top = count ? Math.max(...scores.map(s => s.score || 0)) : 0;
  const avg = count ? (scores.reduce((a, b) => a + (b.score || 0), 0) / count) : 0;

  // simple distribution: bucket scores into 5 buckets based on max
  const buckets = [0, 0, 0, 0, 0];
  if (count && top > 0) {
    const bucketSize = Math.max(1, Math.ceil((top + 1) / buckets.length));
    scores.forEach(s => {
      const sc = s.score || 0;
      const idx = Math.min(buckets.length - 1, Math.floor(sc / bucketSize));
      buckets[idx]++;
    });
  }

  return (
    <div>
      <div className="text-sm text-slate-400">Participants: <strong className="text-white">{count}</strong></div>
      <div className="text-sm text-slate-400 mt-2">Top score: <strong className="text-white">{top}</strong></div>
      <div className="text-sm text-slate-400 mt-2">Average score: <strong className="text-white">{avg.toFixed(2)}</strong></div>

      <div className="mt-4">
        <h5 className="font-semibold mb-2">Score distribution</h5>
        {buckets.map((b, i) => (
          <div key={i} className="text-sm text-slate-300 mb-1">
            <div className="flex justify-between">
              <div>Bucket {i + 1}</div>
              <div>{b}</div>
            </div>
            <div className="w-full bg-slate-700 rounded h-2 mt-1">
              <div className="bg-sky-500 h-2 rounded" style={{ width: `${count ? (b / count) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
