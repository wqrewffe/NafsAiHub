import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { playSound } from '../utils/audio';
import Tutorial from './Tutorial';
import { calculateStats } from '../utils/stats';
import GameResults from './GameResults';
import { saveTrainerResult } from '../utils/firestore';

interface PeripheralVisionGameProps {
  onBack: () => void;
}

// Assuming these utility/component files exist in the specified paths
// In a real scenario, you would create these files.
// For this example, we'll create dummy versions if they are not provided.

/*
// Dummy placeholder for ../utils/audio.ts
export const playSound = (sound: 'start' | 'hit' | 'miss' | 'end') => {
  console.log(`Playing sound: ${sound}`);
};

// Dummy placeholder for ./Tutorial.tsx
const Tutorial: React.FC<{ steps: any[], onClose: () => void }> = ({ steps, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
    <div className="bg-gray-800 p-6 rounded-lg max-w-lg w-full">
      <h2 className="text-2xl mb-4 font-bold">{steps[0].title}</h2>
      <div>{steps[0].content}</div>
      <button onClick={onClose} className="mt-6 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
        Close
      </button>
    </div>
  </div>
);

// Dummy placeholder for ../utils/stats.ts
export const calculateStats = (reactionTimes: number[], hits: number, misses: number) => {
    const total = hits + misses;
    const accuracy = total > 0 ? (hits / total) * 100 : 0;
    const avgReaction = reactionTimes.length > 0 ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length : 0;
    return {
        accuracy,
        averageReactionTime: avgReaction,
        hits,
        misses,
        totalAttempts: total,
        finalScore: 0, // Will be overridden in the component
    };
};

// Dummy placeholder for ./GameResults.tsx
const GameResults: React.FC<{ stats: any; title: string; onPlayAgain: () => void; onSetup: () => void; }> = ({ stats, title, onPlayAgain, onSetup }) => (
  <div className="text-center bg-gray-800 p-6 rounded-lg">
    <h2 className="text-3xl font-bold mb-4">{title}</h2>
    <p>Score: {stats.finalScore}</p>
    <p>Accuracy: {stats.accuracy.toFixed(1)}%</p>
    <div className="flex gap-4 justify-center mt-6">
      <button onClick={onPlayAgain} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded">Play Again</button>
      <button onClick={onSetup} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded">Change Settings</button>
    </div>
  </div>
);

// Dummy placeholder for ../utils/firestore.ts
export const saveTrainerResult = async (trainer: string, stats: any) => {
  console.log(`Saving result for ${trainer}:`, stats);
  return Promise.resolve();
};

*/

const tutorialSteps = [
    {
        title: 'The Goal',
        content: <p>This game trains your ability to detect objects at the edges of your vision. The goal is to accurately click where a target appeared after it disappears.</p>
    },
    {
        title: 'Step 1: Focus',
        content: <p>Keep your eyes locked on the <strong>central plus sign (+)</strong> at all times. Do not move your eyes to search the screen.</p>
    },
    {
        title: 'Step 2: Detect',
        content: <p>A green target will briefly flash somewhere in your peripheral vision and then disappear.</p>
    },
    {
        title: 'Step 3: Click',
        content: <p>After the target disappears, move your mouse and click on the location where you remember seeing it.</p>
    },
    {
        title: 'Accuracy',
        content: <p>Your accuracy will be tracked. The closer you click to the target's actual location, the better. Good luck!</p>
    }
];

type GameState = 'setup' | 'playing' | 'finished';
const VISIBILITY_DURATIONS = { fast: 80, normal: 120, slow: 200 };

interface FeedbackPoint {
    x: number;
    y: number;
    type: 'hit' | 'miss';
    id: number;
}

const PeripheralVisionGame: React.FC<PeripheralVisionGameProps> = ({ onBack }) => {
    const [gameState, setGameState] = useState<GameState>('setup');
    const [target, setTarget] = useState({ x: 0, y: 0, visible: false });
    const [hits, setHits] = useState(0);
    const [misses, setMisses] = useState(0);
    const [reactionTimes, setReactionTimes] = useState<number[]>([]);
    const [isWaitingForClick, setIsWaitingForClick] = useState(false);
    const [feedbackPoints, setFeedbackPoints] = useState<FeedbackPoint[]>([]);
    const [showTutorial, setShowTutorial] = useState(false);
    
    // Settings
    const [numTargets, setNumTargets] = useState(20);
    const [visibility, setVisibility] = useState<'normal' | 'fast' | 'slow'>('normal');
    const [useFullScreen, setUseFullScreen] = useState(false);

    const gameAreaRef = useRef<HTMLDivElement>(null);
    const targetTimeoutRef = useRef<number | null>(null);
    const reactionStartRef = useRef<number>(0);

    const spawnTarget = useCallback(() => {
        if (!gameAreaRef.current) return;
        setIsWaitingForClick(false);
        const gameAreaRect = gameAreaRef.current.getBoundingClientRect();
        const size = 50;
        
        const centerX = gameAreaRect.width / 2;
        const centerY = gameAreaRect.height / 2;
        const minDistance = Math.min(centerX, centerY) * 0.6;

        let x, y;
        do {
            x = Math.random() * (gameAreaRect.width - size);
            y = Math.random() * (gameAreaRect.height - size);
        } while (Math.sqrt(Math.pow(x + size / 2 - centerX, 2) + Math.pow(y + size / 2 - centerY, 2)) < minDistance);

        setTarget({ x, y, visible: true });

        targetTimeoutRef.current = window.setTimeout(() => {
            setTarget(t => ({ ...t, visible: false }));
            setIsWaitingForClick(true);
            reactionStartRef.current = performance.now();
        }, VISIBILITY_DURATIONS[visibility]);
    }, [visibility]);
    
    useEffect(() => {
        if (gameState === 'playing' && hits + misses < numTargets && !target.visible && !isWaitingForClick) {
            const delay = 1000 + Math.random() * 1500;
            const spawnTimeout = setTimeout(spawnTarget, delay);
            return () => clearTimeout(spawnTimeout);
        } else if (hits + misses >= numTargets && gameState === 'playing') {
            playSound('end');
            setGameState('finished');
        }
    }, [gameState, hits, misses, spawnTarget, target.visible, isWaitingForClick, numTargets]);

    const handleGameAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isWaitingForClick) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const targetCenterX = target.x + 25;
        const targetCenterY = target.y + 25;

        const distance = Math.sqrt(Math.pow(clickX - targetCenterX, 2) + Math.pow(clickY - targetCenterY, 2));
        const isHit = distance < 50; // Increased hit radius for better usability
        
        if (isHit) { 
            playSound('hit');
            const reactionTime = performance.now() - reactionStartRef.current;
            setReactionTimes(prev => [...prev, reactionTime]);
            setHits(h => h + 1);
        } else {
            playSound('miss');
            setMisses(m => m + 1);
        }
        
        const id = Date.now() + Math.random();
        setFeedbackPoints(prev => [...prev, { x: clickX, y: clickY, type: isHit ? 'hit' : 'miss', id }]);
        setTimeout(() => {
            setFeedbackPoints(prev => prev.filter(p => p.id !== id));
        }, 500);

        setIsWaitingForClick(false);
    };
    
    const startGame = () => {
        playSound('start');
        setHits(0);
        setMisses(0);
        setReactionTimes([]);
        setFeedbackPoints([]);
        setIsWaitingForClick(false);
        setGameState('playing');
    };
    
    const stats = useMemo(() => {
        const customStats = calculateStats(reactionTimes, hits, misses);
        // A more representative score for this mode
        const score = Math.round(hits * 10 * (customStats.accuracy / 100) - (misses * 5));
        customStats.finalScore = Math.max(0, score); // Score cannot be negative
        return customStats;
    }, [reactionTimes, hits, misses]);

    useEffect(() => {
        if (gameState === 'finished') {
            (async () => {
                try {
                    await saveTrainerResult('peripheral-vision', stats);
                } catch (err) {
                    console.warn('Failed saving peripheral-vision result', err);
                }
            })();
        }
    }, [gameState, stats]);

    return (
        <div className="w-full max-w-4xl flex flex-col items-center animate-fade-in p-2 sm:p-4">
            {showTutorial && <Tutorial steps={tutorialSteps} onClose={() => setShowTutorial(false)} />}
            
            {/* Standard Header - Hidden in Fullscreen */}
            {!useFullScreen && (
                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                    <div className="flex gap-2 w-full sm:w-auto justify-start">
                        <button
                            onClick={onBack}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base"
                            aria-label="Go back to mode selection"
                        >
                            &larr; Back
                        </button>
                        {gameState === 'playing' && (
                            <button
                                onClick={startGame}
                                className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base"
                                aria-label="Reset Game"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                    <div className="text-center order-first sm:order-none">
                        <h1 className="text-3xl sm:text-4xl font-bold font-orbitron text-red-500">Peripheral Vision</h1>
                        <p className="text-gray-400 mt-1 text-sm sm:text-base">Improve detection of peripheral stimuli.</p>
                    </div>
                    <div className="w-full sm:w-auto hidden sm:block"> {/* Spacer */} </div>
                </div>
            )}

            {/* Fullscreen HUD */}
            {useFullScreen && gameState === 'playing' && (
                <div className="fixed top-2 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:top-4 sm:right-4 z-50 flex flex-col sm:flex-row items-center gap-2 sm:gap-6 bg-gray-900 bg-opacity-75 p-2 sm:p-3 rounded-lg shadow-lg">
                    <div className="flex gap-4 text-lg sm:text-xl font-orbitron">
                        <p>Hits: <span className="text-green-400">{hits}</span></p>
                        <p>Misses: <span className="text-red-500">{misses}</span></p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={startGame}
                            className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-1 px-3 sm:py-2 sm:px-4 rounded-lg transition-colors duration-200 text-sm"
                            aria-label="Reset Game"
                        >
                            Reset
                        </button>
                        <button
                            onClick={onBack}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-1 px-3 sm:py-2 sm:px-4 rounded-lg transition-colors duration-200 text-sm"
                            aria-label="Go back to mode selection"
                        >
                            &larr; Exit
                        </button>
                    </div>
                </div>
            )}
            
            {gameState === 'setup' && (
                 <div className="text-center w-full max-w-lg animate-fade-in mt-4">
                    <div className="bg-gray-800 p-4 sm:p-8 rounded-lg space-y-4 sm:space-y-6">
                        <div className="text-center pb-4 border-b border-gray-700">
                            <h2 className="text-xl sm:text-2xl font-orbitron text-white">Cognitive Target: Peripheral Awareness</h2>
                            <p className="text-gray-400 mt-2 text-sm sm:text-base">This exercise expands your "useful field of view" (UFOV) to improve situational awareness.</p>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-lg font-bold text-white block" id="targets-label">Number of Targets</label>
                            <div role="group" aria-labelledby="targets-label" className="flex justify-center gap-2 sm:gap-4">
                                {[10, 20, 30].map(num => (
                                    <button key={num} onClick={() => setNumTargets(num)} className={`px-4 py-2 rounded-lg font-bold text-base sm:text-lg transition-colors ${numTargets === num ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                         <div className="space-y-2">
                            <label className="text-lg font-bold text-white block" id="display-mode-label">Display Mode</label>
                            <div role="group" aria-labelledby="display-mode-label" className="flex justify-center gap-2 sm:gap-4">
                                <button onClick={() => setUseFullScreen(false)} className={`px-4 py-2 rounded-lg font-bold text-base sm:text-lg transition-colors ${!useFullScreen ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                    Contained
                                </button>
                                <button onClick={() => setUseFullScreen(true)} className={`px-4 py-2 rounded-lg font-bold text-base sm:text-lg transition-colors capitalize ${useFullScreen ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                    Full Display
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-lg font-bold text-white block" id="visibility-label">Visibility</label>
                             <div role="group" aria-labelledby="visibility-label" className="flex justify-center gap-2 sm:gap-4">
                                {(['fast', 'normal', 'slow'] as const).map(level => (
                                    <button key={level} onClick={() => setVisibility(level)} className={`px-4 py-2 rounded-lg font-bold text-base sm:text-lg transition-colors capitalize ${visibility === level ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        {level}
                                    </button>
                                ))}
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

            {gameState === 'playing' && (
                <div className="w-full">
                    {/* Standard Stats - Hidden in Fullscreen */}
                    {!useFullScreen && (
                        <div className="flex justify-around w-full text-xl sm:text-2xl font-orbitron my-2 sm:my-4">
                            <p>Hits: <span className="text-green-400">{hits}</span></p>
                            <p>Misses: <span className="text-red-500">{misses}</span></p>
                        </div>
                    )}
                     <div
                        ref={gameAreaRef}
                        className={`cursor-crosshair overflow-hidden select-none touch-none ${
                            useFullScreen
                                ? 'fixed inset-0 z-40 bg-gray-800'
                                : 'relative w-full aspect-video max-h-[75vh] bg-gray-800 rounded-lg'
                        }`}
                        onClick={handleGameAreaClick}
                        role="button"
                        tabIndex={-1}
                        aria-label="Game area"
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl sm:text-5xl text-gray-600 select-none">+</div>
                        {feedbackPoints.map(p => (
                            <div
                                key={p.id}
                                className={`absolute w-5 h-5 rounded-full -translate-x-1/2 -translate-y-1/2 animate-fade-out pointer-events-none ${p.type === 'hit' ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ top: `${p.y}px`, left: `${p.x}px` }}
                            />
                        ))}
                        {target.visible && (
                            <div
                                className="absolute bg-green-500 rounded-full"
                                style={{
                                    top: `${target.y}px`,
                                    left: `${target.x}px`,
                                    width: `25px`,
                                    height: `25px`,
                                }}
                                aria-label="Peripheral target"
                            />
                        )}
                    </div>
                </div>
            )}
            
            {gameState === 'finished' && (
                 <div className="w-full max-w-lg mt-8">
                     <GameResults
                        stats={stats}
                        title="Peripheral Vision Results"
                        onPlayAgain={startGame}
                        onSetup={() => setGameState('setup')}
                    />
                 </div>
            )}
        </div>
    );
};

export default PeripheralVisionGame;