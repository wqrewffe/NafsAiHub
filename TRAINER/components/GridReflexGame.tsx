import React, { useState, useEffect, useMemo, useRef } from 'react';
// Assuming these types and utils exist in the specified paths
// You might need to create these files if they don't exist.
// import { GridGameState, GameStats } from '../types';
// import { playSound } from '../utils/audio';
// import Tutorial from './Tutorial';
// import { calculateStats } from '../utils/stats';
// import GameResults from './GameResults';
// import { saveTrainerResult } from '../utils/firestore';

// --- Mocked Imports for Standalone Usage ---
// In your project, you would use your actual imports.
// These are placeholders to make the component runnable.

type GridGameState = 'setup' | 'countdown' | 'playing' | 'finished';

interface GameStats {
  hits: number;
  misses: number;
  accuracy: number;
  averageReaction: number;
  score: number;
  duration: number;
}

const playSound = (sound: 'start' | 'hit' | 'miss' | 'end') => {
  console.log(`Playing sound: ${sound}`);
};

const Tutorial: React.FC<{ steps: any[]; onClose: () => void }> = ({ steps, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center animate-fade-in p-4">
    <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full">
      <h2 className="text-2xl font-bold mb-4">{steps[0].title}</h2>
      {steps[0].content}
      <button onClick={onClose} className="mt-6 w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg">
        Close
      </button>
    </div>
  </div>
);

const calculateStats = (reactionTimes: number[], hits: number, misses: number, duration: number): GameStats => {
    const totalAttempts = hits + misses;
    const accuracy = totalAttempts > 0 ? (hits / totalAttempts) * 100 : 0;
    const averageReaction = reactionTimes.length > 0 ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length : 0;
    const score = Math.round(hits * (1000 / (averageReaction || 1000)) * (accuracy / 100));
    return { hits, misses, accuracy, averageReaction, score, duration };
};

const GameResults: React.FC<{ stats: GameStats; onPlayAgain: () => void; onSetup: () => void }> = ({ stats, onPlayAgain, onSetup }) => (
     <div className="text-center w-full max-w-lg animate-fade-in bg-gray-800 p-6 rounded-lg">
        <h2 className="text-3xl font-orbitron text-yellow-400 mb-4">Results</h2>
        <div className="grid grid-cols-2 gap-4 text-lg mb-6">
            <p>Score: <span className="font-bold text-white">{stats.score}</span></p>
            <p>Hits: <span className="font-bold text-green-400">{stats.hits}</span></p>
            <p>Misses: <span className="font-bold text-red-500">{stats.misses}</span></p>
            <p>Accuracy: <span className="font-bold text-white">{stats.accuracy.toFixed(1)}%</span></p>
            <p className="col-span-2">Avg. Reaction: <span className="font-bold text-blue-400">{stats.averageReaction.toFixed(0)} ms</span></p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={onPlayAgain} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg text-lg font-orbitron">Play Again</button>
            <button onClick={onSetup} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-lg text-lg font-orbitron">Change Settings</button>
        </div>
    </div>
);

const saveTrainerResult = async (trainer: string, stats: GameStats) => {
    console.log(`Saving result for ${trainer}:`, stats);
    // In a real app, this would be an API call to Firestore.
    return Promise.resolve();
};

// --- End of Mocked Imports ---


interface GridReflexGameProps {
  onBack: () => void;
}

const tutorialSteps = [
    {
        title: 'The Goal',
        content: <p>Hit the green targets that appear on the grid as quickly and accurately as you can before the time runs out.</p>
    },
    {
        title: 'Scoring',
        content: <p>You get points for each successful hit. Your speed and accuracy are measured to give you a final performance score.</p>
    },
    {
        title: 'Avoid Misses',
        content: <p>Clicking on an empty square counts as a miss and will negatively impact your accuracy. Be precise!</p>
    },
    {
        title: 'Settings',
        content: <div><p>You can adjust the challenge by changing:</p><ul className="list-disc list-inside mt-2"><li><strong>Grid Size:</strong> A larger grid requires more screen awareness.</li><li><strong>Duration:</strong> Test your endurance with longer rounds.</li></ul></div>
    },
];

const GridReflexGame: React.FC<GridReflexGameProps> = ({ onBack }) => {
    const [gameState, setGameState] = useState<GridGameState>('setup');
    const [gridSize, setGridSize] = useState(3);
    const [duration, setDuration] = useState(30);
    const [useFullScreen, setUseFullScreen] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [countdown, setCountdown] = useState(3);
    const [showTutorial, setShowTutorial] = useState(false);
    
    const [activeCell, setActiveCell] = useState<number | null>(null);
    const [hits, setHits] = useState(0);
    const [misses, setMisses] = useState(0);
    const [reactionTimes, setReactionTimes] = useState<number[]>([]);
    const [gridShake, setGridShake] = useState(false);
    const [missedCell, setMissedCell] = useState<number | null>(null);
    
    const targetTimeRef = useRef<number>(0);
    
    const startGame = () => {
        playSound('start');
        setGameState('countdown');
        setCountdown(3);
    }

    useEffect(() => {
        let timer: number;
        if (gameState === 'countdown' && countdown > 0) {
            timer = window.setTimeout(() => setCountdown(c => c - 1), 1000);
        } else if (gameState === 'countdown' && countdown === 0) {
            setGameState('playing');
            setTimeLeft(duration);
            setHits(0);
            setMisses(0);
            setReactionTimes([]);
            setActiveCell(Math.floor(Math.random() * (gridSize * gridSize)));
            targetTimeRef.current = performance.now();
        }
        return () => clearTimeout(timer);
    }, [gameState, countdown, duration, gridSize]);

    useEffect(() => {
        let gameTimer: number;
        if (gameState === 'playing' && timeLeft > 0) {
            gameTimer = window.setTimeout(() => setTimeLeft(t => t - 1), 1000);
        } else if (gameState === 'playing' && timeLeft === 0) {
            playSound('end');
            setGameState('finished');
        }
        return () => clearTimeout(gameTimer);
    }, [gameState, timeLeft]);

    const handleCellClick = (index: number) => {
        if (gameState !== 'playing' || activeCell === null) return;

        if (index === activeCell) {
            playSound('hit');
            const now = performance.now();
            const reaction = now - targetTimeRef.current;
            setReactionTimes(times => [...times, reaction]);
            setHits(h => h + 1);

            let newActiveCell;
            do {
                newActiveCell = Math.floor(Math.random() * (gridSize * gridSize));
            } while (newActiveCell === activeCell);
            
            setActiveCell(newActiveCell);
            targetTimeRef.current = performance.now();
        } else {
            playSound('miss');
            setMisses(m => m + 1);
            setMissedCell(index);
            setTimeout(() => setMissedCell(null), 200);
            if (!gridShake) {
                setGridShake(true);
                setTimeout(() => setGridShake(false), 400);
            }
        }
    }
    
    const stats = useMemo(() => calculateStats(reactionTimes, hits, misses, duration), [reactionTimes, hits, misses, duration]);

    useEffect(() => {
        if (gameState === 'finished') {
            (async () => {
                try {
                    await saveTrainerResult('grid-reflex', stats);
                } catch (err) {
                    console.warn('Failed to save grid-reflex result', err);
                }
            })();
        }
    }, [gameState, stats]);

    const renderContent = () => {
        switch (gameState) {
            case 'setup':
                return (
                    <div className="text-center w-full max-w-lg animate-fade-in">
                        <div className="bg-gray-800 p-6 rounded-lg space-y-5">
                            <div className="text-center pb-4 border-b border-gray-700">
                                <h2 className="text-2xl sm:text-3xl font-orbitron text-white">Cognitive Target: Selective Attention</h2>
                                <p className="text-gray-300 mt-2 text-sm sm:text-base">This mode targets your ability to rapidly scan a visual field, identify a relevant stimulus, and execute a precise motor response.</p>
                            </div>
                            <div>
                                <label className="text-lg sm:text-xl font-bold text-white block mb-2" id="grid-size-label">Grid Size</label>
                                <div role="group" aria-labelledby="grid-size-label" className="flex justify-center gap-2 sm:gap-4">
                                    {[3, 4, 5].map(size => (
                                        <button key={size} onClick={() => setGridSize(size)} className={`px-4 py-2 rounded-md font-bold text-base sm:text-lg transition-colors ${gridSize === size ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                            {size}x{size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-lg sm:text-xl font-bold text-white block mb-2" id="duration-label">Duration</label>
                                <div role="group" aria-labelledby="duration-label" className="flex justify-center gap-2 sm:gap-4">
                                    {[15, 30, 60].map(sec => (
                                        <button key={sec} onClick={() => setDuration(sec)} className={`px-4 py-2 rounded-md font-bold text-base sm:text-lg transition-colors ${duration === sec ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                            {sec}s
                                        </button>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <label className="text-lg sm:text-xl font-bold text-white block mb-2" id="display-mode-label">Display Mode</label>
                                <div role="group" aria-labelledby="display-mode-label" className="flex justify-center gap-2 sm:gap-4">
                                    <button onClick={() => setUseFullScreen(false)} className={`px-4 py-2 rounded-md font-bold text-base sm:text-lg transition-colors ${!useFullScreen ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        Contained
                                    </button>
                                    <button onClick={() => setUseFullScreen(true)} className={`px-4 py-2 rounded-md font-bold text-base sm:text-lg transition-colors ${useFullScreen ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        Full Display
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 pt-3">
                                <button onClick={() => setShowTutorial(true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-md sm:text-lg font-orbitron transition-transform transform hover:scale-105">
                                    How to Play
                                </button>
                                <button onClick={startGame} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg text-md sm:text-lg font-orbitron transition-transform transform hover:scale-105">
                                    Start
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'countdown':
                return <p key={countdown} className="text-8xl md:text-9xl font-orbitron font-bold text-yellow-400 animate-countdown-zoom" role="timer">{countdown}</p>;

            case 'playing':
                return (
                    <div className={useFullScreen ? 'fixed inset-0 z-40 bg-gray-900 flex flex-col items-center justify-center p-2' : "w-full flex flex-col items-center"}>
                        {/* Stats Header */}
                        <div className={useFullScreen ? 'fixed top-16 left-1/2 -translate-x-1/2 flex justify-between w-full max-w-xs sm:max-w-sm text-lg sm:text-xl font-orbitron z-50 bg-gray-900/50 p-2 rounded-lg' : "flex justify-between w-full max-w-xs sm:max-w-md md:max-w-lg mb-4 text-lg sm:text-xl md:text-2xl font-orbitron"}>
                            <p>Time: <span className="text-yellow-400">{timeLeft}</span></p>
                            <p>Hits: <span className="text-green-400">{hits}</span></p>
                            <p>Misses: <span className="text-red-500">{misses}</span></p>
                        </div>
                        {/* Game Grid */}
                        <div
                            className={`grid p-1 rounded-lg ${useFullScreen ? 'w-full h-full' : 'w-full max-w-md md:max-w-lg aspect-square bg-gray-900'} ${gridShake ? 'animate-shake' : ''}`}
                            style={{ 
                                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                                gap: useFullScreen ? '2px' : '0.5rem',
                                ...(useFullScreen && { gridTemplateRows: `repeat(${gridSize}, 1fr)` })
                             }}
                            role="grid"
                        >
                            {[...Array(gridSize * gridSize)].map((_, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleCellClick(i)}
                                    className={`transition-colors duration-75 cursor-pointer rounded-sm sm:rounded-md
                                        ${i === activeCell ? 'bg-green-500 shadow-glow-green animate-pop-in' : missedCell === i ? 'bg-red-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                                    role="gridcell"
                                    aria-label={`Cell ${i + 1}${i === activeCell ? ' active' : ''}`}
                                />
                            ))}
                        </div>
                    </div>
                );

            case 'finished':
                return (
                    <GameResults 
                        stats={stats}
                        onPlayAgain={startGame}
                        onSetup={() => setGameState('setup')}
                    />
                );
            default: return null;
        }
    };
    
    const title = gameState === 'setup' ? "Grid Reflex Setup" : "Grid Reflex";
    const subtitle = "Assess your multi-faceted reflex performance.";

    return (
        <div className="w-full max-w-6xl flex flex-col items-center animate-fade-in p-4">
            {showTutorial && <Tutorial steps={tutorialSteps} onClose={() => setShowTutorial(false)} />}
            
            {/* Main Header - Not shown in fullscreen playing state */}
            {!useFullScreen && (
                <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                    {/* Left Aligned Buttons */}
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={onBack}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm sm:text-base w-1/2 sm:w-auto"
                            aria-label="Go back to mode selection"
                        >
                            &larr; Change Mode
                        </button>
                        {gameState === 'playing' && (
                            <button
                                onClick={() => setGameState('setup')}
                                className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm sm:text-base w-1/2 sm:w-auto"
                                aria-label="End Game"
                            >
                                End Game
                            </button>
                        )}
                    </div>

                    {/* Centered Title */}
                    <div className="text-center order-first sm:order-none">
                        {(gameState === 'setup' || gameState === 'playing' || gameState === 'finished') && (
                            <>
                                <h1 className="text-3xl md:text-4xl font-bold font-orbitron text-red-500">{title}</h1>
                                {gameState === 'setup' && <p className="text-gray-400 mt-1 text-sm sm:text-base">{subtitle}</p>}
                            </>
                        )}
                    </div>
                    
                    {/* Empty div for spacing in sm:flex-row layout */}
                    <div className="hidden sm:flex w-auto" style={{minWidth: '200px'}} />
                </div>
            )}
            
            {/* Fullscreen UI Buttons */}
            {useFullScreen && gameState === 'playing' && (
                <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-gray-900 bg-opacity-75 p-2 rounded-lg shadow-lg">
                    <button
                        onClick={() => {
                            setUseFullScreen(false);
                            setGameState('setup');
                        }}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm sm:text-base"
                        aria-label="Exit Fullscreen"
                    >
                       Exit
                    </button>
                </div>
            )}

            <div className="w-full flex justify-center">
              {renderContent()}
            </div>
        </div>
    );
};

export default GridReflexGame;