import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// Assume these helper files exist in ../utils/
// import { playSound } from '../utils/audio';
// import Tutorial from './Tutorial';
// import { calculateStats } from '../utils/stats';
// import GameResults from './GameResults';


// ========================================================================
// MOCKED HELPER COMPONENTS AND FUNCTIONS FOR DEMONSTRATION
// In your actual project, you would import these from their real files.
// ========================================================================

const playSound = (sound: 'start' | 'hit' | 'miss' | 'end') => {
  console.log(`Playing sound: ${sound}`);
  // In a real app, you'd use the Web Audio API here.
};

const Tutorial: React.FC<{ steps: any[], onClose: () => void }> = ({ steps, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 animate-fade-in">
    <div className="bg-gray-800 text-white rounded-lg shadow-xl p-6 max-w-md w-full relative">
      <h2 className="text-2xl font-bold mb-4">{steps[0].title}</h2>
      <div>{steps[0].content}</div>
      <p className="text-sm mt-4 text-gray-400">This is a simplified tutorial preview. Click close to exit.</p>
      <button onClick={onClose} className="absolute top-2 right-2 text-2xl text-gray-400 hover:text-white">&times;</button>
      <button onClick={onClose} className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg">
        Close
      </button>
    </div>
  </div>
);

const calculateStats = (reactionTimes: number[], hits: number, misses: number) => {
  if (reactionTimes.length === 0) {
    return {
      average: 'N/A',
      fastest: 'N/A',
      slowest: 'N/A',
      accuracy: hits + misses > 0 ? `${((hits / (hits + misses)) * 100).toFixed(0)}%` : 'N/A',
      hits,
      misses,
    };
  }
  const avg = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
  const fastest = Math.min(...reactionTimes);
  const slowest = Math.max(...reactionTimes);
  const accuracy = ((hits / (hits + misses)) * 100).toFixed(0);

  return {
    average: `${avg.toFixed(0)}ms`,
    fastest: `${fastest.toFixed(0)}ms`,
    slowest: `${slowest.toFixed(0)}ms`,
    accuracy: `${accuracy}%`,
    hits,
    misses,
  };
};

const GameResults: React.FC<{ stats: any; title: string; onPlayAgain: () => void; onSetup: () => void; }> = ({ stats, title, onPlayAgain, onSetup }) => (
  <div className="bg-gray-800 text-white rounded-lg shadow-xl p-6 md:p-8 w-full max-w-lg mx-auto text-center animate-fade-in">
    <h2 className="text-3xl md:text-4xl font-orbitron font-bold text-red-500 mb-4">{title}</h2>
    <div className="grid grid-cols-2 gap-4 text-left my-6">
      <div className="bg-gray-700 p-4 rounded-lg">
        <p className="text-sm text-gray-400">Accuracy</p>
        <p className="text-2xl font-bold text-green-400">{stats.accuracy}</p>
      </div>
      <div className="bg-gray-700 p-4 rounded-lg">
        <p className="text-sm text-gray-400">Average Time</p>
        <p className="text-2xl font-bold text-yellow-400">{stats.average}</p>
      </div>
       <div className="bg-gray-700 p-4 rounded-lg">
        <p className="text-sm text-gray-400">Hits / Misses</p>
        <p className="text-2xl font-bold">{stats.hits} / {stats.misses}</p>
      </div>
      <div className="bg-gray-700 p-4 rounded-lg">
        <p className="text-sm text-gray-400">Fastest</p>
        <p className="text-2xl font-bold">{stats.fastest}</p>
      </div>
    </div>
    <div className="flex flex-col sm:flex-row gap-4 mt-8">
      <button onClick={onSetup} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-transform transform hover:scale-105">
        Change Settings
      </button>
      <button onClick={onPlayAgain} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg text-lg font-orbitron transition-transform transform hover:scale-105">
        Play Again
      </button>
    </div>
  </div>
);
// ========================================================================
// END OF MOCKED HELPERS
// ========================================================================


interface VisualSearchGameProps {
  onBack: () => void;
}

const tutorialSteps = [
    {
        title: 'The Goal',
        content: <p>This game tests your visual processing speed. Your goal is to find a specific target icon within a grid of distracting icons as quickly as possible.</p>
    },
    {
        title: 'Step 1: Identify Target',
        content: <p>At the start of each round, you will be briefly shown the target icon you need to find. Memorize its shape and color.</p>
    },
    {
        title: 'Step 2: Find and Click',
        content: <p>The target will then disappear, and you'll be shown a grid of icons. Scan the grid and click on the icon that matches the target.</p>
    },
    {
        title: 'Elite Mode: Target May Be Absent',
        content: <p>In "Elite" difficulty, there's a chance the target is <strong>not in the grid</strong>. If you've scanned the grid and are sure it's not there, click the "Target Not Present" button to score a point.</p>
    }
];

type GameState = 'setup' | 'prompt' | 'playing' | 'finished';
type Shape = 'circle' | 'square' | 'triangle' | 'plus';
type Difficulty = 'normal' | 'hard' | 'elite';
const SHAPES: Shape[] = ['circle', 'square', 'triangle', 'plus'];
const COLORS = ['#EF4444', '#22C55E', '#3B82F6', '#EAB308']; // Red, Green, Blue, Yellow

interface Icon {
  shape: Shape;
  color: string;
}

const IconDisplay: React.FC<{ icon: Icon, isDynamic: boolean, className?: string }> = React.memo(({ icon, isDynamic, className = '' }) => {
    return (
        <div className={`${isDynamic ? 'animate-jiggle' : ''} ${className}`}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" fill={icon.color} preserveAspectRatio="xMidYMid meet">
                {icon.shape === 'circle' && <circle cx="50" cy="50" r="45" />}
                {icon.shape === 'square' && <rect x="5" y="5" width="90" height="90" rx="10" />}
                {icon.shape === 'triangle' && <path d="M50 5 L95 95 L5 95 Z" />}
                {icon.shape === 'plus' && <path d="M45 5 H55 V45 H95 V55 H55 V95 H45 V55 H5 V45 H45 Z" fillRule="evenodd" />}
            </svg>
        </div>
    );
});

const VisualSearchGame: React.FC<VisualSearchGameProps> = ({ onBack }) => {
    const [gameState, setGameState] = useState<GameState>('setup');
    const [target, setTarget] = useState<Icon | null>(null);
    const [gridItems, setGridItems] = useState<Icon[]>([]);
    const [targetIndex, setTargetIndex] = useState(-1);
    const [reactionTimes, setReactionTimes] = useState<number[]>([]);
    const [hits, setHits] = useState(0);
    const [misses, setMisses] = useState(0);
    const [roundsPlayed, setRoundsPlayed] = useState(0);
    const [timeLeftInRound, setTimeLeftInRound] = useState<number | null>(null);
    const [isTargetPresent, setIsTargetPresent] = useState(true);
    const [showTutorial, setShowTutorial] = useState(false);

    // Settings
    const [rounds, setRounds] = useState(10);
    const [gridSize, setGridSize] = useState(6);
    const [difficulty, setDifficulty] = useState<Difficulty>('normal');
    const [useDynamicGrid, setUseDynamicGrid] = useState(false);
    const [useFullScreen, setUseFullScreen] = useState(false);
    
    const reactionStartRef = useRef<number>(0);
    const roundTimerRef = useRef<number | null>(null);

    const generateRound = useCallback(() => {
        const newTarget: Icon = {
            shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
        };
        setTarget(newTarget);
        
        const totalCells = gridSize * gridSize;
        const items: Icon[] = [];
        
        const isElite = difficulty === 'elite';
        const shouldTargetBePresent = isElite ? Math.random() > 0.2 : true; // 20% chance absent in elite
        setIsTargetPresent(shouldTargetBePresent);
        
        const newTargetIndex = shouldTargetBePresent ? Math.floor(Math.random() * totalCells) : -1;
        setTargetIndex(newTargetIndex);

        for (let i = 0; i < totalCells; i++) {
            if (i === newTargetIndex) {
                items.push(newTarget);
            } else {
                let distractor: Icon;
                do {
                    if (difficulty === 'hard' || difficulty === 'elite') { // High similarity distractors
                        const changeShape = Math.random() > 0.5;
                        if (changeShape) {
                            distractor = { ...newTarget, shape: SHAPES.filter(s => s !== newTarget.shape)[Math.floor(Math.random() * (SHAPES.length - 1))] };
                        } else {
                            distractor = { ...newTarget, color: COLORS.filter(c => c !== newTarget.color)[Math.floor(Math.random() * (COLORS.length - 1))] };
                        }
                    } else { // Normal difficulty
                        distractor = {
                            shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
                            color: COLORS[Math.floor(Math.random() * COLORS.length)],
                        };
                    }
                } while (distractor.shape === newTarget.shape && distractor.color === newTarget.color);
                items.push(distractor);
            }
        }
        setGridItems(items);
        setGameState('prompt');
    }, [gridSize, difficulty]);

    const proceedToNextRound = useCallback(() => {
        if (roundsPlayed + 1 >= rounds) {
            playSound('end');
            setGameState('finished');
        } else {
            setRoundsPlayed(r => r + 1);
            generateRound();
        }
    }, [rounds, roundsPlayed, generateRound]);

    useEffect(() => {
        if (gameState === 'prompt') {
            const promptDuration = difficulty === 'elite' ? 800 : 1500;
            const timer = setTimeout(() => {
                playSound('start');
                setGameState('playing');
                reactionStartRef.current = performance.now();
            }, promptDuration);
            return () => clearTimeout(timer);
        }
    }, [gameState, difficulty]);

    useEffect(() => {
        const clearRoundTimer = () => {
            if (roundTimerRef.current) {
                clearInterval(roundTimerRef.current);
                roundTimerRef.current = null;
            }
        };

        if (gameState === 'playing' && difficulty === 'elite') {
            const roundTimeLimit = Math.max(3000, 12000 - (gridSize * 500)); // Time in ms, scaled by grid size
            setTimeLeftInRound(roundTimeLimit);

            const startTime = Date.now();
            roundTimerRef.current = window.setInterval(() => {
                const elapsedTime = Date.now() - startTime;
                const newTimeLeft = roundTimeLimit - elapsedTime;

                if (newTimeLeft <= 0) {
                    setTimeLeftInRound(0);
                    playSound('miss');
                    setMisses(m => m + 1);
                    clearRoundTimer();
                    proceedToNextRound();
                } else {
                    setTimeLeftInRound(newTimeLeft);
                }
            }, 100);
        }

        return clearRoundTimer;
    }, [gameState, difficulty, gridSize, roundsPlayed, proceedToNextRound]);

    const handleItemClick = (index: number) => {
        if (gameState !== 'playing') return;
        if (index === targetIndex) {
            playSound('hit');
            const time = performance.now() - reactionStartRef.current;
            setReactionTimes(prev => [...prev, time]);
            setHits(h => h + 1);
        } else {
            playSound('miss');
            setMisses(m => m + 1);
        }
        proceedToNextRound();
    };
    
    const handleTargetNotPresentClick = () => {
        if (gameState !== 'playing') return;
        if (!isTargetPresent) { // Correct!
            playSound('hit');
            const time = performance.now() - reactionStartRef.current;
            setReactionTimes(prev => [...prev, time]);
            setHits(h => h + 1);
        } else { // Incorrect! Target was there.
            playSound('miss');
            setMisses(m => m + 1);
        }
        proceedToNextRound();
    };

    const startGame = () => {
        setReactionTimes([]);
        setHits(0);
        setMisses(0);
        setRoundsPlayed(0);
        setTimeLeftInRound(null);
        generateRound();
    };

    const stats = useMemo(() => calculateStats(reactionTimes, hits, misses), [reactionTimes, hits, misses]);

    return (
        <div className="w-full max-w-4xl flex flex-col items-center animate-fade-in p-2 sm:p-4">
            {showTutorial && <Tutorial steps={tutorialSteps} onClose={() => setShowTutorial(false)} />}
            
            {!useFullScreen && (
                 <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4 mb-4" style={{ minHeight: '4rem' }}>
                    <div className="w-full md:w-auto flex justify-start z-10"><button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 text-base">&larr; Change Mode</button></div>
                    <div className="text-center">
                        <h1 className="text-3xl md:text-4xl font-bold font-orbitron text-red-500">Visual Search</h1>
                        <p className="text-gray-400 mt-1 text-base">Find the target among distractors.</p>
                    </div>
                    <div className="hidden md:block w-full md:w-auto" /> {/* Spacer for centering on desktop */}
                </div>
            )}
            
            {useFullScreen && gameState === 'playing' && (
                 <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 bg-gray-900 bg-opacity-75 p-2 rounded-lg shadow-lg">
                     <div className="flex gap-4 text-lg sm:text-xl font-orbitron">
                         <span>Round: <span className="text-yellow-400">{roundsPlayed + 1} / {rounds}</span></span>
                         {difficulty === 'elite' && timeLeftInRound !== null && (
                            <span className="text-red-500">Time: {(timeLeftInRound / 1000).toFixed(1)}s</span>
                        )}
                    </div>
                     <div className="flex gap-2">
                         <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-1.5 px-3 rounded-lg transition-colors duration-200 text-sm">&larr; Exit</button>
                    </div>
                </div>
            )}

            {gameState === 'setup' && (
                 <div className="text-center w-full max-w-2xl animate-fade-in mt-4">
                    <div className="bg-gray-800 p-6 rounded-lg space-y-5">
                        <div className="text-center pb-4 border-b border-gray-700">
                             <h2 className="text-2xl font-orbitron text-white">Cognitive Target: Visual Processing Speed</h2>
                             <p className="text-gray-400 mt-2 text-sm md:text-base">This exercise trains your ability to rapidly scan a complex environment and identify a target. Higher difficulties introduce highly similar distractors, visual noise, and time pressure to push your selective attention and processing speed to their absolute limits.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="text-lg font-bold text-white block mb-2">Number of Rounds</label>
                                <div className="flex justify-center gap-2">{[5, 10, 15].map(num => <button key={num} onClick={() => setRounds(num)} className={`px-3 py-1.5 rounded-md font-semibold text-base transition-colors ${rounds === num ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{num}</button>)}</div>
                            </div>
                            <div>
                                <label className="text-lg font-bold text-white block mb-2">Grid Size</label>
                                <div className="flex justify-center gap-2 flex-wrap">{[4, 6, 8, 10, 12].map(size => <button key={size} onClick={() => setGridSize(size)} className={`px-3 py-1.5 rounded-md font-semibold text-base transition-colors ${gridSize === size ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{size}x{size}</button>)}</div>
                            </div>
                            <div>
                                <label className="text-lg font-bold text-white block mb-2">Distractor Similarity</label>
                                <div className="flex justify-center gap-2 flex-wrap">{(['normal', 'hard', 'elite'] as const).map(d => <button key={d} onClick={() => setDifficulty(d)} className={`px-3 py-1.5 rounded-md font-semibold text-base capitalize transition-colors ${difficulty === d ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{d}</button>)}</div>
                            </div>
                            <div>
                                <label className="text-lg font-bold text-white block mb-2">Visual Noise</label>
                                <button onClick={() => setUseDynamicGrid(d => !d)} className={`w-full px-3 py-1.5 rounded-md font-semibold text-base transition-colors ${useDynamicGrid ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{useDynamicGrid ? 'Dynamic ON' : 'Dynamic OFF'}</button>
                            </div>
                             <div className="col-span-1 md:col-span-2">
                                <label className="text-lg font-bold text-white block mb-2" id="display-mode-label">Display Mode</label>
                                <div role="group" aria-labelledby="display-mode-label" className="flex justify-center gap-4">
                                    <button onClick={() => setUseFullScreen(false)} className={`px-4 py-2 rounded-lg font-bold text-base transition-colors ${!useFullScreen ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        Contained
                                    </button>
                                    <button onClick={() => setUseFullScreen(true)} className={`px-4 py-2 rounded-lg font-bold text-base transition-colors ${useFullScreen ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        Full Display
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button onClick={() => setShowTutorial(true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-lg font-orbitron transition-transform transform hover:scale-105">
                                How to Play
                            </button>
                            <button onClick={startGame} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg text-lg font-orbitron transition-transform transform hover:scale-105">
                                Start
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {gameState === 'prompt' && target && (
                 <div className={`${useFullScreen ? 'fixed inset-0 z-40' : 'w-full min-h-[24rem]'} bg-gray-800 rounded-lg flex flex-col items-center justify-center p-4 text-center`}>
                    <p className="text-2xl md:text-3xl font-orbitron text-white mb-4">Find this icon:</p>
                    <IconDisplay icon={target} isDynamic={false} className="w-20 h-20 md:w-24 md:h-24" />
                </div>
            )}

            {(gameState === 'playing') && (
                 <div className={`${useFullScreen ? 'fixed inset-0 z-40' : 'w-full'} flex flex-col items-center`}>
                    {!useFullScreen && (
                        <div className="flex justify-between items-center w-full text-lg font-orbitron mb-2 px-1">
                            <span>Round: <span className="text-yellow-400">{roundsPlayed + 1} / {rounds}</span></span>
                            {difficulty === 'elite' && timeLeftInRound !== null && (
                                <span className="text-red-500">Time: {(timeLeftInRound / 1000).toFixed(1)}s</span>
                            )}
                        </div>
                    )}
                    <div className={`grid p-1 rounded-lg ${useFullScreen ? 'w-full h-full overflow-auto gap-0 bg-gray-800' : 'gap-1 bg-gray-800 max-w-full'}`} style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`}}>
                        {gridItems.map((item, i) => (
                             <div key={i} onClick={() => handleItemClick(i)} className={`aspect-square cursor-pointer flex items-center justify-center transition-colors ${useFullScreen ? 'bg-gray-900 border border-gray-700 hover:bg-gray-700' : 'bg-gray-900 rounded-sm hover:bg-gray-700 p-0.5'}`}>
                                 <IconDisplay icon={item} isDynamic={useDynamicGrid} className="w-full h-full"/>
                             </div>
                        ))}
                    </div>
                    {difficulty === 'elite' && (
                        <div className={`${useFullScreen ? 'fixed bottom-4 left-4 right-4 z-50' : 'mt-4 w-full'}`}>
                            {/* <button onClick={handleTargetNotPresentClick} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-lg text-lg transition-colors">Target Not Present</button> */}
                        </div>
                    )}
                 </div>
            )}

            {gameState === 'finished' && (
                 <div className="w-full mt-8">
                     <GameResults
                        stats={stats}
                        title="Finished!"
                        onPlayAgain={startGame}
                        onSetup={() => setGameState('setup')}
                    />
                </div>
            )}
        </div>
    );
};

export default VisualSearchGame;