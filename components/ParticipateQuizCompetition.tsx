import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Quiz, QuizQuestion } from './QuizTypes';
import { onCompetitionsSnapshot, joinCompetition, submitCompetitionScore } from '../services/quizService';
import { useAuth } from '../hooks/useAuth';

const ADMIN_EMAIL = 'nafisabdullah424@gmail.com';

type CompetitionStatus = 'upcoming' | 'ongoing' | 'past';

interface Competition {
  id: string;
  quiz: Quiz;
  startAt: string; // ISO
  endAt: string; // ISO
  participants: { userId: string; name: string; score?: number }[];
}

const placeholderFetchDelay = 400; // ms

// Error boundary to catch rendering/runtime errors inside the Participate UI
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error | null }> {
  // initialize state as a class field to satisfy TypeScript
  state: { hasError: boolean; error?: Error | null } = { hasError: false, error: null };

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // log the error for debugging/telemetry
    console.error('ErrorBoundary caught error in ParticipateQuizCompetition:', error, info);
  }

  reset() {
    // some local TS configs in this repo cause React.Component instance methods to be unresolved
    // cast to any to ensure this works at runtime while keeping types for most of the class
    if ((this as any).setState) {
      (this as any).setState({ hasError: false, error: null });
    } else {
      this.state = { hasError: false, error: null };
      if ((this as any).forceUpdate) (this as any).forceUpdate();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-900 text-white rounded">
          <h3 className="text-lg font-bold">Something went wrong</h3>
          <p className="text-sm mt-2">An unexpected error occurred while loading the competition. Try reloading or come back later.</p>
          <div className="mt-3">
            <button onClick={this.reset} className="bg-white text-red-900 px-3 py-1 rounded">Retry</button>
          </div>
        </div>
      );
    }
  return (this as any).props.children as any;
  }
}

export default function ParticipateQuizCompetition() {
  const { currentUser } = useAuth();
  const [competitions, setCompetitions] = useState<any[] | null>(null);
  const [activeCompetition, setActiveCompetition] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onCompetitionsSnapshot(items => {
      setCompetitions(items);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, []);

  const categorized = useMemo(() => {
    if (!competitions) return { upcoming: [], ongoing: [], past: [] };
    const upcoming: any[] = [];
    const ongoing: any[] = [];
    const past: any[] = [];
    const now = Date.now();
    competitions.forEach((c: any) => {
      // respect visibility flag: hidden competitions are only visible to admin or organizer
      const isAdmin = currentUser?.email === ADMIN_EMAIL;
      const isOrganizer = currentUser && c.quiz && c.quiz.organizerId === currentUser.uid;
      if (c.visible === false && !isAdmin && !isOrganizer) return; // skip hidden

      const s = new Date(c.startAt).getTime();
      const e = new Date(c.endAt).getTime();
      if (e < now) past.push(c);
      else if (s <= now && e >= now) ongoing.push(c);
      else upcoming.push(c);
    });
    return { upcoming, ongoing, past };
  }, [competitions]);

  const beginCompetition = useCallback(async (c: any) => {
    if (!currentUser) {
      alert('Please sign in to join competitions.');
      return;
    }
    // organizers cannot participate in their own competition
    if (currentUser.uid === c.quiz?.organizerId) {
      alert('Organizers cannot participate in their own competition.');
      return;
    }
    try {
      await joinCompetition(c.id, { userId: currentUser.uid, name: currentUser.displayName || currentUser.email || 'Anonymous' });
      setActiveCompetition(c);
    } catch (err: any) {
      console.error('Failed to join competition', err);
      alert('Failed to join competition');
    }
  }, [currentUser]);

  return (
    <ErrorBoundary>
      <div className="participate-quiz-competition space-y-6">
      <h2 className="text-2xl font-bold">Quiz Competitions</h2>

      {loading && <p className="text-slate-400">Loading competitions...</p>}

      {!loading && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-primary rounded">
            <h3 className="font-semibold mb-2">Ongoing</h3>
            {categorized.ongoing.length === 0 ? <p className="text-slate-400">No ongoing competitions</p> : (
              <ul className="space-y-2">
                {categorized.ongoing.map(c => (
                  <li key={c.id} className="p-2 bg-secondary rounded flex justify-between items-center">
                    <div>
                      <div className="font-medium">{c.quiz.title}</div>
                      <div className="text-xs text-slate-400">Ends: {new Date(c.endAt).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/competition/${c.id}`} className="btn-animated bg-accent text-white px-3 py-1 rounded">Join</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-4 bg-primary rounded">
            <h3 className="font-semibold mb-2">Upcoming</h3>
            {categorized.upcoming.length === 0 ? <p className="text-slate-400">No upcoming competitions</p> : (
              <ul className="space-y-2">
                {categorized.upcoming.map(c => (
                  <li key={c.id} className="p-2 bg-secondary rounded flex justify-between items-center">
                    <div>
                      <div className="font-medium">{c.quiz.title}</div>
                      <div className="text-xs text-slate-400">Starts: {new Date(c.startAt).toLocaleString()}</div>
                    </div>
                    <div>
                      <Link to={`/competition/${c.id}`} className="px-3 py-1 rounded border">View</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-4 bg-primary rounded">
            <h3 className="font-semibold mb-2">Past</h3>
            {categorized.past.length === 0 ? <p className="text-slate-400">No past competitions</p> : (
              <ul className="space-y-2">
                {categorized.past.map(c => (
                  <li key={c.id} className="p-2 bg-secondary rounded flex justify-between items-center">
                    <div>
                      <div className="font-medium">{c.quiz.title}</div>
                      <div className="text-xs text-slate-400">Ended: {new Date(c.endAt).toLocaleString()}</div>
                    </div>
                    <div>
                      <Link to={`/competition/${c.id}`} className="px-3 py-1 rounded border">View Results</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {activeCompetition && (
        <CompetitionRunner competition={activeCompetition} onClose={() => setActiveCompetition(null)} />
      )}

      </div>
    </ErrorBoundary>
  );
}

const CompetitionRunner: React.FC<{ competition: any; onClose: () => void }> = ({ competition, onClose }) => {
  const { currentUser } = useAuth();
  // store enriched question objects with a pre-shuffled `shuffledOptions` array to avoid
  // mutating the original data during render (calling .sort() in render caused issues)
  const [shuffledQuestions, setShuffledQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  // persist answers per question so users can navigate back/prev
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const questions: any[] = (competition.quiz.questions || []).map((ques: QuizQuestion) => ({
      ...ques,
      // create a per-question shuffled options array so render won't re-shuffle or mutate source
      shuffledOptions: ques.options ? [...ques.options].sort(() => Math.random() - 0.5) : []
    }));
    // shuffle question order
    const shuffled = questions.sort(() => Math.random() - 0.5);
  setShuffledQuestions(shuffled);
  setCurrentIdx(0);
  setSelected(null);
  setAnswers(new Array(shuffled.length).fill(null));
  setFinished(false);
  setTimeLeft(30);
  }, [competition]);

  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // auto-advance when time runs out
          handleNext(true);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [finished, currentIdx]);

  const handleSelect = (opt: string) => {
    // record selection for current question
    setAnswers(prev => {
      const copy = [...prev];
      copy[currentIdx] = opt;
      return copy;
    });
    setSelected(opt);
  };

  const handleNext = (skipped = false) => {
    const next = currentIdx + 1;
    setTimeLeft(30);
    if (next >= shuffledQuestions.length) {
      // finish: compute score from answers
      setFinished(true);
      const computedFinal = answers.reduce((acc, a, i) => acc + ((a && a === shuffledQuestions[i].answer) ? 1 : 0), 0);
      setFinalScore(computedFinal);
      if (currentUser) {
        submitCompetitionScore(competition.id, { userId: currentUser.uid, name: currentUser.displayName || currentUser.email || 'Anonymous', score: computedFinal });
      }
      return;
    }
    setCurrentIdx(next);
    // restore previously selected answer if any
    setSelected(answers[next] || null);
  };

  const handlePrev = () => {
    if (currentIdx <= 0) return;
    const prevIdx = currentIdx - 1;
    setCurrentIdx(prevIdx);
    setTimeLeft(30);
    setSelected(answers[prevIdx] || null);
  };

  return (
    <div className="p-4 bg-secondary rounded">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold">{competition.quiz.title}</h3>
          <p className="text-sm text-slate-400">Organizer: {competition.quiz.organizerId}</p>
        </div>
        <div className="text-sm text-slate-400">{new Date(competition.startAt).toLocaleString()} - {new Date(competition.endAt).toLocaleString()}</div>
      </div>

      {!finished && shuffledQuestions.length > 0 && (
        <div>
          <div className="w-full bg-slate-700 rounded-full h-3.5 relative mb-3">
            <div className="h-3.5 rounded-full bg-sky-500" style={{ width: `${((currentIdx) / shuffledQuestions.length) * 100}%` }} />
          </div>
          <div className="p-4 bg-slate-800 rounded">
            <p className="font-bold text-lg mb-2">{currentIdx + 1}. {shuffledQuestions[currentIdx].question}</p>
            <div className="grid grid-cols-1 gap-2">
              {shuffledQuestions[currentIdx].shuffledOptions.map((opt: string, idx: number) => (
                <button key={`${opt}-${idx}`} onClick={() => handleSelect(opt)} disabled={!!selected} className={`p-3 rounded ${selected ? (opt === shuffledQuestions[currentIdx].answer ? 'bg-green-600' : (opt === selected ? 'bg-red-600' : 'bg-slate-800 opacity-60')) : 'bg-slate-700 hover:bg-slate-600'}`}>
                  {opt}
                </button>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 text-sm text-slate-400">
              <div>Score: <span className="font-bold text-white">{answers.slice(0, currentIdx + 1).reduce((acc, a, i) => acc + ((a && a === shuffledQuestions[i].answer) ? 1 : 0), 0)}</span></div>
              {/* no fixed per-question timer displayed when navigation is free */}
              <div />
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={handlePrev} disabled={currentIdx === 0} className="px-4 py-2 rounded border">Prev</button>
              <button onClick={() => handleNext(false)} className="bg-accent text-white px-4 py-2 rounded">{currentIdx < shuffledQuestions.length - 1 ? 'Next' : 'Finish'}</button>
              <button onClick={onClose} className="px-4 py-2 rounded border">Exit</button>
            </div>
          </div>
        </div>
      )}

      {finished && (
        <div className="p-4 bg-slate-800 rounded">
          <h4 className="text-lg font-bold">Finished</h4>
          <p className="mt-2">Your Score: <span className="font-bold">{finalScore ?? answers.reduce((acc, a, i) => acc + ((a && a === shuffledQuestions[i].answer) ? 1 : 0), 0)} / {shuffledQuestions.length}</span></p>
          <p className="text-sm text-slate-400 mt-2">Your result has been submitted to the competition leaderboard.</p>
          <div className="mt-4">
            <button onClick={onClose} className="bg-accent text-white px-4 py-2 rounded">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};
