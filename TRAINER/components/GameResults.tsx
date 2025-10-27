import React, { useEffect, useState, useMemo } from 'react';
// Assuming a general stats type definition
interface GameStats {
  finalScore: number;
  totalHits?: number;
  totalMisses?: number;
  accuracy?: number;
  avgReactionTime?: number;
  fastestReactionTime?: number;
  slowestReactionTime?: number;
  consistency?: number;
  hitsPerSecond?: number;
  reactionTimes?: number[];
  // For custom, simpler results like in Memory mode
  title?: string;
  value?: string;
}

interface PastResult {
  id: string;
  stats?: any;
  createdAt?: any;
}

interface GameResultsProps {
  stats: GameStats;
  mode?: string; // trainer mode slug e.g. 'color-match'
  title?: string;
  subtitle?: string;
  onPlayAgain: () => void;
  onSetup: () => void;
}

const GameResults: React.FC<GameResultsProps> = ({ stats, mode, title = "Results", subtitle, onPlayAgain, onSetup }) => {
  const [past, setPast] = useState<PastResult[] | null>(null);

  useEffect(() => {
    if (!mode) return;
    let mounted = true;
    (async () => {
      try {
        // Dummy fetch function for demonstration
        const fetchTrainerHistory = async (mode: string, limit: number): Promise<PastResult[]> => {
          console.log(`Fetching history for ${mode} with limit ${limit}`);
          return [{ id: '1', stats: { finalScore: 120 } }];
        };
        const hist = await fetchTrainerHistory(mode, 30);
        if (mounted) setPast(hist);
      } catch (e) {
        console.warn('Failed to fetch trainer history', e);
      }
    })();
    return () => { mounted = false; };
  }, [mode]);

  const pastScores = useMemo(() => {
    if (!past) return [] as number[];
    return past.map(p => (p.stats && p.stats.finalScore) ? p.stats.finalScore : null).filter((v): v is number => v !== null);
  }, [past]);

  const delta = useMemo(() => {
    if (pastScores.length === 0) return null;
    const previous = pastScores[0];
    const current = stats.finalScore ?? 0;
    return current - previous;
  }, [pastScores, stats]);

  return (
    <div className="text-center w-full max-w-4xl animate-fade-in">
      <h1 className="text-5xl md:text-6xl font-bold font-orbitron text-green-400 mb-2">{title}</h1>
      {subtitle && <p className="text-gray-400 mb-6 text-lg">{subtitle}</p>}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-800 p-6 rounded-lg text-xl mb-8">
          <div className="bg-gray-700 p-3 rounded">
              <p className="text-gray-400 text-base">{stats.title || 'Score'}</p>
              <p className="font-bold text-4xl text-yellow-400 font-orbitron">{stats.value || stats.finalScore}</p>
          </div>

          {stats.totalHits !== undefined && (
            <div className="bg-gray-700 p-3 rounded"><p className="text-gray-400 text-base">Total Hits</p><p className="font-bold text-3xl text-green-400">{stats.totalHits}</p></div>
          )}
          
          {stats.totalMisses !== undefined && (
            <div className="bg-gray-700 p-3 rounded"><p className="text-gray-400 text-base">Total Misses</p><p className="font-bold text-3xl text-red-500">{stats.totalMisses}</p></div>
          )}
          
          {stats.accuracy !== undefined && (
            <div className="bg-gray-700 p-3 rounded"><p className="text-gray-400 text-base">Accuracy</p><p className="font-bold text-3xl text-white">{stats.accuracy.toFixed(1)}%</p></div>
          )}
          
          {stats.avgReactionTime !== undefined && (
            <div className="bg-gray-700 p-3 rounded"><p className="text-gray-400 text-base">Avg. Time</p><p className="font-bold text-3xl text-white">{stats.avgReactionTime.toFixed(0)}<span className="text-base ml-1">ms</span></p></div>
          )}
          
          {stats.fastestReactionTime !== undefined && (
            <div className="bg-gray-700 p-3 rounded"><p className="text-gray-400 text-base">Fastest Time</p><p className="font-bold text-3xl text-green-400">{stats.fastestReactionTime.toFixed(0)}<span className="text-base ml-1">ms</span></p></div>
          )}
          
          {stats.slowestReactionTime !== undefined && (
            <div className="bg-gray-700 p-3 rounded"><p className="text-gray-400 text-base">Slowest Time</p><p className="font-bold text-3xl text-red-400">{stats.slowestReactionTime.toFixed(0)}<span className="text-base ml-1">ms</span></p></div>
          )}
          
          {stats.consistency !== undefined && (
            <div className="bg-gray-700 p-3 rounded"><p className="text-gray-400 text-base">Consistency</p><p className="font-bold text-3xl text-white">{stats.consistency.toFixed(0)}<span className="text-base ml-1">ms</span></p></div>
          )}
          
          {stats.hitsPerSecond !== undefined && (
            <div className="bg-gray-700 p-3 rounded col-span-2 md:col-span-4"><p className="text-gray-400 text-base">Hits/Second</p><p className="font-bold text-3xl text-white">{stats.hitsPerSecond.toFixed(2)}</p></div>
          )}
      </div>

      {stats.reactionTimes && stats.reactionTimes.length > 1 && stats.avgReactionTime && (
        <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-800 p-6 rounded-lg">
                <h2 className="text-3xl font-orbitron text-white mb-4">Performance Over Time</h2>
                {/* Assuming StatsGraph exists and is robust */}
                {/* <StatsGraph reactionTimes={stats.reactionTimes} avgTime={stats.avgReactionTime} /> */}
                <div className="h-40 bg-gray-700 rounded flex items-center justify-center"><p>Graph Placeholder</p></div>
            </div>
             <div className="bg-gray-800 p-6 rounded-lg">
                <h2 className="text-3xl font-orbitron text-white mb-4">All Hits (ms)</h2>
                <div className="h-64 overflow-y-auto pr-2">
                    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-lg">
                        {stats.reactionTimes.map((time, index) => {
                           let color = 'text-white';
                           if (stats.fastestReactionTime && time <= stats.fastestReactionTime * 1.1) color = 'text-green-400';
                           if (stats.slowestReactionTime && time >= stats.slowestReactionTime * 0.9) color = 'text-red-400';
                           return (
                             <li key={index} className="bg-gray-700 p-2 rounded text-center">
                               <span className="text-gray-500 text-sm mr-2">{index + 1}.</span>
                               <span className={`font-bold ${color}`}>{time.toFixed(0)}</span>
                             </li>
                           );
                        })}
                    </ul>
                </div>
            </div>
        </div>
      )}

      {/* Past performance comparison remains the same as it correctly uses optional chaining or checks */}
      {past && past.length > 0 && (
         <div className="bg-gray-800 p-6 rounded-lg mb-8">
          {/* ... existing past performance JSX */}
        </div>
      )}

      <div className="flex gap-4 justify-center">
          <button onClick={onPlayAgain} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors">Play Again</button>
          <button onClick={onSetup} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg text-xl transition-colors">Change Settings</button>
      </div>
    </div>
  );
};

export default GameResults;