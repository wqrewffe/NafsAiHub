import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { playSound } from '../utils/audio';
import Tutorial from './Tutorial';
import { calculateStats } from '../utils/stats';
import GameResults from './GameResults';
import { saveTrainerResult } from '../utils/firestore';

interface PrecisionPointGameProps {
  onBack: () => void;
}

type GameState = 'setup' | 'playing' | 'finished';

const tutorialSteps = [
    {
        title: 'The Goal',
        content: <p>Click the green target as quickly and accurately as possible for the set number of rounds.</p>
    },
    {
        title: 'Increasing Difficulty',
        content: <p>With each successful hit, the target will <strong>shrink</strong> and reappear in a <strong>new, random location.</strong></p>
    },
    {
        title: 'Accuracy is Key',
        content: <p>Clicking the background instead of the target counts as a miss. Your final accuracy and average reaction time will be displayed at the end.</p>
    },
    {
        title: 'Settings',
        content: <div><p>You can adjust the challenge by changing:</p><ul className="list-disc list-inside mt-2"><li><strong>Number of Targets:</strong> How many targets you need to hit to finish.</li><li><strong>Starting Size:</strong> A smaller starting size is much harder!</li></ul></div>
    }
];

const MAX_SIZES = { small: 60, medium: 80, large: 100 };
const MIN_SIZE = 10;

const PrecisionPointGame: React.FC<PrecisionPointGameProps> = ({ onBack }) => {
    const [gameState, setGameState] = useState<GameState>('setup');

    // Settings
    const [numTargets, setNumTargets] = useState(20);
    const [startDifficulty, setStartDifficulty] = useState<'medium' | 'small' | 'large'>('medium');
    const [useFullScreen, setUseFullScreen] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);

    // Game State
    const [target, setTarget] = useState({ x: 0, y: 0, size: MAX_SIZES.medium });
    const [hits, setHits] = useState(0);
    const [misses, setMisses] = useState(0);
    const [reactionTimes, setReactionTimes] = useState<number[]>([]);
    const [missedFlash, setMissedFlash] = useState(false);
    const [hitEffects, setHitEffects] = useState<{x: number; y: number; size: number; id: number}[]>([]);
    
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const reactionStartRef = useRef<number>(0);

    const spawnTarget = useCallback(() => {
        if (!gameAreaRef.current) return;
        const gameAreaRect = gameAreaRef.current.getBoundingClientRect();
        const maxSize = MAX_SIZES[startDifficulty];
        const reductionPerHit = (maxSize - MIN_SIZE) / numTargets;
        const newSize = Math.max(MIN_SIZE, maxSize - (hits * reductionPerHit));
        
        const x = Math.random() * (gameAreaRect.width - newSize);
        const y = Math.random() * (gameAreaRect.height - newSize);
        
        setTarget({ x, y, size: newSize });
        reactionStartRef.current = performance.now();
    }, [hits, numTargets, startDifficulty]);

    useEffect(() => {
        if (gameState === 'playing' && hits < numTargets) {
            spawnTarget();
        } else if (gameState === 'playing' && hits >= numTargets) {
            playSound('end');
            setGameState('finished');
        }
    }, [gameState, hits, spawnTarget, numTargets]);

    const handleHit = (e: React.MouseEvent) => {
        e.stopPropagation();
        playSound('hit');
        const reactionTime = performance.now() - reactionStartRef.current;
        setReactionTimes(prev => [...prev, reactionTime]);

        const effectId = Date.now() + Math.random();
        setHitEffects(prev => [...prev, {id: effectId, x: target.x, y: target.y, size: target.size}]);
        setTimeout(() => {
            setHitEffects(effects => effects.filter(ef => ef.id !== effectId));
        }, 300);

        setHits(prev => prev + 1);
    };

    const handleMiss = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target !== e.currentTarget || gameState !== 'playing') return;
        playSound('miss');
        setMisses(prev => prev + 1);
        setMissedFlash(true);
        setTimeout(() => setMissedFlash(false), 200);
    };

    const startGame = () => {
        playSound('start');
        setHits(0);
        setMisses(0);
        setReactionTimes([]);
        setTarget(t => ({...t, size: MAX_SIZES[startDifficulty]}));
        setGameState('playing');
    };
    
    const stats = useMemo(() => calculateStats(reactionTimes, hits, misses), [reactionTimes, hits, misses]);

    useEffect(() => {
        if (gameState === 'finished') {
            saveTrainerResult('precision-point', stats).catch(err => console.warn('Failed saving precision-point result', err));
        }
    }, [gameState, stats]);

    return (
        <div className="w-full max-w-4xl flex flex-col items-center animate-fade-in p-4">
            {showTutorial && <Tutorial steps={tutorialSteps} onClose={() => setShowTutorial(false)} />}
            
            {!useFullScreen && (
                <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={onBack}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-200 text-sm md:text-base"
                            aria-label="Go back to mode selection"
                        >
                            &larr; Change Mode
                        </button>
                        {gameState === 'playing' && (
                            <button
                                onClick={startGame}
                                className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-200 text-sm md:text-base"
                                aria-label="Reset Game"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                    <div className="text-center order-first md:order-none">
                        <h1 className="text-3xl md:text-4xl font-bold font-orbitron text-red-500">Precision Point</h1>
                        <p className="text-gray-400 mt-1 text-sm md:text-base">Hone your visuomotor precision and speed.</p>
                    </div>
                    <div className="hidden md:block w-[150px]"></div> {/* Spacer for alignment */}
                </div>
            )}
            
            {useFullScreen && gameState === 'playing' && (
                 <div className="fixed top-2 left-1/2 -translate-x-1/2 sm:top-4 sm:right-4 sm:left-auto sm:translate-x-0 z-50 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 bg-gray-900 bg-opacity-75 p-2 sm:p-3 rounded-lg shadow-lg">
                    <div className="flex gap-4 text-lg sm:text-xl font-orbitron">
                        <p>Hits: <span className="text-green-400">{hits}/{numTargets}</span></p>
                        <p>Misses: <span className="text-red-500">{misses}</span></p>
                    </div>
                     <div className="flex gap-2">
                        <button
                            onClick={startGame}
                            className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-1 px-3 rounded-md text-sm"
                            aria-label="Reset Game"
                        >
                            Reset
                        </button>
                        <button
                            onClick={onBack}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-1 px-3 rounded-md text-sm"
                            aria-label="Go back to mode selection"
                        >
                            &larr; Exit
                        </button>
                    </div>
                </div>
            )}

            {gameState === 'setup' && (
                 <div className="text-center w-full max-w-lg animate-fade-in mt-4">
                    <div className="bg-gray-800 p-4 sm:p-8 rounded-lg space-y-6">
                        <div className="text-center pb-4 border-b border-gray-700">
                            <h2 className="text-xl md:text-2xl font-orbitron text-white">Target: Fine Motor Control</h2>
                            <p className="text-gray-400 mt-2 text-sm">This drill enhances aiming accuracy. It challenges your ability to make rapid, targeted movements to increasingly smaller targets.</p>
                        </div>
                        <div>
                            <label className="text-lg font-bold text-white block mb-2" id="targets-label">Number of Targets</label>
                            <div role="group" aria-labelledby="targets-label" className="flex justify-center gap-2 sm:gap-4">
                                {[10, 20, 30].map(num => (
                                    <button key={num} onClick={() => setNumTargets(num)} className={`px-4 py-2 rounded-lg font-bold text-base transition-colors ${numTargets === num ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-lg font-bold text-white block mb-2" id="size-label">Starting Size</label>
                            <div role="group" aria-labelledby="size-label" className="flex justify-center gap-2 sm:gap-4">
                                {(['small', 'medium', 'large'] as const).map(size => (
                                    <button key={size} onClick={() => setStartDifficulty(size)} className={`px-4 py-2 rounded-lg font-bold text-base transition-colors capitalize ${startDifficulty === size ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                         <div>
                            <label className="text-lg font-bold text-white block mb-2" id="display-mode-label">Display Mode</label>
                            <div role="group" aria-labelledby="display-mode-label" className="flex justify-center gap-2 sm:gap-4">
                                <button onClick={() => setUseFullScreen(false)} className={`px-4 py-2 rounded-lg font-bold text-base transition-colors ${!useFullScreen ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                    Contained
                                </button>
                                <button onClick={() => setUseFullScreen(true)} className={`px-4 py-2 rounded-lg font-bold text-base transition-colors ${useFullScreen ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                    Full Display
                                </button>
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
                    {!useFullScreen && (
                        <div className="flex justify-around w-full text-xl md:text-2xl font-orbitron my-2">
                            <p>Hits: <span className="text-green-400">{hits} / {numTargets}</span></p>
                            <p>Misses: <span className="text-red-500">{misses}</span></p>
                        </div>
                    )}
                    <div
                        ref={gameAreaRef}
                        className={`overflow-hidden cursor-crosshair transition-colors duration-200 ${missedFlash ? '!bg-red-900' : ''} ${useFullScreen ? 'fixed inset-0 z-40 bg-gray-800' : 'relative w-full h-72 md:h-96 lg:h-[500px] bg-gray-800 rounded-lg'}`}
                        onClick={handleMiss}
                        role="button"
                        tabIndex={-1}
                        aria-label="Game area"
                    >
                        {hitEffects.map(effect => (
                            <div
                                key={effect.id}
                                className="absolute rounded-full border-green-400 animate-hit-effect pointer-events-none"
                                style={{
                                    top: `${effect.y}px`,
                                    left: `${effect.x}px`,
                                    width: `${effect.size}px`,
                                    height: `${effect.size}px`,
                                }}
                            />
                        ))}
                        {hits < numTargets && (
                            <div
                                className="absolute bg-green-500 rounded-full shadow-glow-green"
                                style={{
                                    top: `${target.y}px`,
                                    left: `${target.x}px`,
                                    width: `${target.size}px`,
                                    height: `${target.size}px`,
                                    transition: 'width 0.1s, height 0.1s'
                                }}
                                onClick={handleHit}
                                aria-label="Target"
                            />
                        )}
                    </div>
                </div>
            )}
            
            {gameState === 'finished' && (
                 <div className="w-full mt-8">
                     <GameResults 
                        stats={stats}
                        onPlayAgain={startGame}
                        onSetup={() => setGameState('setup')}
                     />
                 </div>
            )}
        </div>
    );
};

export default PrecisionPointGame;