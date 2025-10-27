import React, { useState, useEffect, useMemo } from 'react';
import { playSound } from '../utils/audio';
import Tutorial from './Tutorial';
import { calculateStats } from '../utils/stats';
import GameResults from './GameResults';
import { saveTrainerResult } from '../utils/firestore';

interface DodgeAndClickGameProps {
  onBack: () => void;
}

const tutorialSteps = [
    {
        title: 'Step 1: Define Your Targets',
        content: <div><p>In the setup screen, click on the colored squares to assign them a rule:</p><ul className="list-disc list-inside mt-2"><li><strong className="text-green-400">Click (✓):</strong> These are your targets. You get points for clicking them.</li><li><strong className="text-red-500">Dodge (✗):</strong> These are decoys. You lose points for clicking them.</li><li><strong>Neutral:</strong> These colors can be ignored.</li></ul><p className="mt-2">You must have at least one "Click" color to start.</p></div>
    },
    {
        title: 'Step 2: Play the Game',
        content: <p>Once the game starts, colored squares will randomly appear on the grid. Your goal is to click the "good" colors and avoid clicking the "bad" ones as fast as possible.</p>
    },
    {
        title: 'Scoring',
        content: <p>You get points for hitting the correct targets and lose a significant number of points for hitting the wrong ones. The goal is to get the highest score possible before time runs out.</p>
    }
];

type GameState = 'setup' | 'playing' | 'finished';
type TargetType = 'good' | 'bad';

const AVAILABLE_COLORS: { [key: string]: string } = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    orange: 'bg-orange-500',
    cyan: 'bg-cyan-500',
};
const COLOR_NAMES = Object.keys(AVAILABLE_COLORS);

const SPEEDS = {
    slow: { interval: 1200, spawn: 0.5, disappear: 0.3 },
    normal: { interval: 1000, spawn: 0.6, disappear: 0.4 },
    fast: { interval: 700, spawn: 0.75, disappear: 0.5 },
};

interface Target {
  id: number;
  type: TargetType;
  color: string;
  spawnTime: number;
}

const DodgeAndClickGame: React.FC<DodgeAndClickGameProps> = ({ onBack }) => {
    const [gameState, setGameState] = useState<GameState>('setup');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [showTutorial, setShowTutorial] = useState(false);
    
    // Settings
    const [duration, setDuration] = useState(30);
    const [gridSize, setGridSize] = useState(4);
    const [goodColors, setGoodColors] = useState<string[]>(['green']);
    const [badColors, setBadColors] = useState<string[]>(['red']);
    const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
    const [useFullScreen, setUseFullScreen] = useState(false);
    
    const [targets, setTargets] = useState<(Target | null)[]>([]);
    const [feedback, setFeedback] = useState<{ index: number, type: TargetType } | null>(null);
    const [reactionTimes, setReactionTimes] = useState<number[]>([]);
    const [hits, setHits] = useState(0);
    const [misses, setMisses] = useState(0);

    const totalCells = useMemo(() => gridSize * gridSize, [gridSize]);
    
    // Countdown Timer
    useEffect(() => {
        if (gameState !== 'playing') return;

        if (timeLeft > 0) {
            const countdownTimer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
            return () => clearTimeout(countdownTimer);
        } else {
            playSound('end');
            setGameState('finished');
        }
    }, [gameState, timeLeft]);
    
    // Game Logic Tick
    useEffect(() => {
        if (gameState !== 'playing' || timeLeft <= 0) return;

        const gameColors = [...goodColors, ...badColors];
        if (gameColors.length === 0) {
            setGameState('finished');
            return;
        }

        const { interval, spawn, disappear } = SPEEDS[speed];
        
        const gameTick = setInterval(() => {
            setTargets(currentTargets => {
                let newTargets = [...currentTargets];
                newTargets.forEach((target, i) => {
                    if (target && Math.random() < disappear) {
                        newTargets[i] = null;
                    }
                });

                const emptyCells = newTargets.map((t, i) => t === null ? i : -1).filter(i => i !== -1);
                if (emptyCells.length > 0 && Math.random() < spawn) {
                    const spawnIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                    if(newTargets[spawnIndex] === null) {
                        const randomColor = gameColors[Math.floor(Math.random() * gameColors.length)];
                        const type = goodColors.includes(randomColor) ? 'good' : 'bad';
                        newTargets[spawnIndex] = {
                            id: Date.now() + spawnIndex,
                            type: type,
                            color: randomColor,
                            spawnTime: performance.now(),
                        };
                    }
                }
                return newTargets;
            });

        }, interval);

        return () => clearInterval(gameTick);

    }, [gameState, timeLeft, goodColors, badColors, speed, totalCells]);
    
    const handleTargetClick = (target: Target | null, index: number) => {
        if (!target || feedback) return;

        if (target.type === 'good') {
            playSound('hit');
            const reactionTime = performance.now() - target.spawnTime;
            setReactionTimes(prev => [...prev, reactionTime]);
            setHits(h => h + 1);
            setScore(s => s + 10);
        } else {
            playSound('miss');
            setMisses(m => m + 1);
            setScore(s => s - 20);
        }

        setFeedback({ index, type: target.type });
        
        setTimeout(() => {
            setTargets(prevTargets => {
                const newTargets = [...prevTargets];
                if (newTargets[index]?.id === target.id) {
                    newTargets[index] = null;
                }
                return newTargets;
            });
            setFeedback(null);
        }, 300);
    };
    
    const getCellClasses = (target: Target | null, i: number) => {
        if (feedback?.index === i) {
            return feedback.type === 'good' ? 'bg-green-300 scale-105' : 'bg-red-300 animate-shake';
        }
        if (target) {
            const base = AVAILABLE_COLORS[target.color];
            return `${base} cursor-pointer animate-pop-in`;
        }
        return 'bg-gray-800';
    }

    const startGame = () => {
        playSound('start');
        setScore(0);
        setHits(0);
        setMisses(0);
        setReactionTimes([]);
        setTimeLeft(duration);
        setTargets(Array(totalCells).fill(null));
        setFeedback(null);
        setGameState('playing');
    };

    const handleColorSelect = (colorName: string) => {
        const isGood = goodColors.includes(colorName);
        const isBad = badColors.includes(colorName);

        if (isGood) {
            setGoodColors(gc => gc.filter(c => c !== colorName));
            setBadColors(bc => [...bc, colorName]);
        } else if (isBad) {
            setBadColors(bc => bc.filter(c => c !== colorName));
        } else {
            setGoodColors(gc => [...gc, colorName]);
        }
    };
    
    const isStartDisabled = goodColors.length === 0;
    const stats = useMemo(() => {
      const finalStats = calculateStats(reactionTimes, hits, misses, duration);
      finalStats.finalScore = score;
      return finalStats;
    }, [reactionTimes, hits, misses, duration, score]);

    useEffect(() => {
        if (gameState === 'finished') {
            (async () => {
                try {
                    await saveTrainerResult('dodgeAndClick', stats);
                } catch (err) {
                    console.warn('Unable to save trainer result:', err);
                }
            })();
        }
    }, [gameState, stats]);

    return (
         <div className="w-full max-w-3xl mx-auto p-4 flex flex-col items-center animate-fade-in">
            {showTutorial && <Tutorial steps={tutorialSteps} onClose={() => setShowTutorial(false)} />}
            
            {!useFullScreen && (
              <header className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                  <div className="flex gap-2 self-start sm:self-center">
                      <button
                          onClick={onBack}
                          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-200 text-base"
                          aria-label="Go back to mode selection"
                      >
                          &larr; Back
                      </button>
                      {gameState === 'playing' && (
                          <button
                              onClick={startGame}
                              className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-200 text-base"
                              aria-label="Reset Game"
                          >
                              Reset
                          </button>
                      )}
                  </div>
                  <div className="text-center order-first sm:order-none">
                      <h1 className="text-3xl md:text-4xl font-bold font-orbitron text-red-500">Dodge & Click</h1>
                      <p className="text-gray-400 mt-1 text-sm md:text-base">Sharpen cognitive discrimination and impulse control.</p>
                  </div>
              </header>
            )}

            {useFullScreen && gameState === 'playing' && (
                <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 bg-gray-900 bg-opacity-80 p-2 sm:p-3 rounded-lg shadow-lg">
                    <div className="flex gap-4 text-lg sm:text-xl font-orbitron">
                        <p>Time: <span className="text-yellow-400">{timeLeft}</span></p>
                        <p>Score: <span className={`${score >= 0 ? 'text-green-400' : 'text-red-500'}`}>{score}</span></p>
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
                <div className="w-full animate-fade-in">
                    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg space-y-6">
                        <div className="text-center pb-4 border-b border-gray-700">
                            <h2 className="text-xl sm:text-2xl font-orbitron text-white">Cognitive Target: Response Inhibition</h2>
                            <p className="text-gray-400 mt-2 text-sm sm:text-base">This mode trains you to quickly categorize stimuli and withhold action, a key component of impulse control.</p>
                        </div>
                        <div>
                            <label className="text-lg font-bold text-white block mb-2 text-center" id="color-select-label">Target Colors</label>
                            <p className="text-gray-400 text-sm text-center mb-3">Click to cycle: <span className="text-green-400">Click</span> &rarr; <span className="text-red-500">Dodge</span> &rarr; Neutral</p>
                            <div className="grid grid-cols-4 gap-2 sm:gap-3">
                                {COLOR_NAMES.map(name => {
                                    const isGood = goodColors.includes(name);
                                    const isBad = badColors.includes(name);
                                    const ringClass = isGood ? 'ring-green-400' : isBad ? 'ring-red-500' : 'ring-gray-700';
                                    return (
                                        <div key={name} onClick={() => handleColorSelect(name)} className={`w-full h-14 sm:h-16 rounded-lg cursor-pointer flex items-center justify-center ring-2 sm:ring-4 transition-all ${AVAILABLE_COLORS[name]} ${ringClass}`}>
                                           {isGood && <span className="text-white text-3xl font-bold">&#x2713;</span>}
                                           {isBad && <span className="text-white text-3xl font-bold">&#x2717;</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                            <div>
                                <label className="text-lg font-bold text-white block mb-2" id="duration-label">Duration</label>
                                <div role="group" aria-labelledby="duration-label" className="flex justify-center gap-2">
                                    {[15, 30, 60].map(sec => (
                                        <button key={sec} onClick={() => setDuration(sec)} className={`px-4 py-2 rounded-lg font-semibold text-base transition-colors ${duration === sec ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                            {sec}s
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-lg font-bold text-white block mb-2" id="grid-size-label">Grid Size</label>
                                <div role="group" aria-labelledby="grid-size-label" className="flex justify-center gap-2">
                                    {[3, 4, 5].map(size => (
                                        <button key={size} onClick={() => setGridSize(size)} className={`px-4 py-2 rounded-lg font-semibold text-base transition-colors ${gridSize === size ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                            {size}x{size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <label className="text-lg font-bold text-white block mb-2" id="speed-label">Speed</label>
                                <div role="group" aria-labelledby="speed-label" className="flex justify-center gap-2">
                                    {(['slow', 'normal', 'fast'] as const).map(s => (
                                        <button key={s} onClick={() => setSpeed(s)} className={`px-4 py-2 rounded-lg font-semibold text-base transition-colors capitalize ${speed === s ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <label className="text-lg font-bold text-white block mb-2" id="display-mode-label">Display Mode</label>
                                <div role="group" aria-labelledby="display-mode-label" className="flex justify-center gap-2">
                                    <button onClick={() => setUseFullScreen(false)} className={`px-4 py-2 rounded-lg font-semibold text-base transition-colors ${!useFullScreen ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        Contained
                                    </button>
                                    <button onClick={() => setUseFullScreen(true)} className={`px-4 py-2 rounded-lg font-semibold text-base transition-colors ${useFullScreen ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        Full
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button onClick={() => setShowTutorial(true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-lg font-orbitron transition-transform transform hover:scale-105">
                                How to Play
                            </button>
                            <button onClick={startGame} disabled={isStartDisabled} className={`w-full font-bold py-3 rounded-lg text-lg font-orbitron transition-all transform hover:scale-105 ${isStartDisabled ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'}`}>
                                {isStartDisabled ? 'Select a "Click" color' : 'Start'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {gameState === 'playing' && (
                <div className={useFullScreen ? 'fixed inset-0 z-40 bg-gray-900' : 'w-full flex flex-col items-center'}>
                    {!useFullScreen && (
                        <div className="flex justify-between w-full text-xl sm:text-2xl font-orbitron mb-4">
                            <p>Time: <span className="text-yellow-400">{timeLeft}</span></p>
                            <p>Score: <span className={`${score >= 0 ? 'text-green-400' : 'text-red-500'}`}>{score}</span></p>
                        </div>
                    )}
                    <div
                        className={`grid ${useFullScreen ? 'w-full h-full gap-0' : 'w-full p-1.5 bg-gray-900 rounded-lg gap-1.5'}`}
                        style={{ 
                            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                            ...(useFullScreen && { gridTemplateRows: `repeat(${gridSize}, 1fr)` })
                        }}
                    >
                       {[...Array(totalCells)].map((_, i) => {
                            const target = targets[i];
                            return (
                               <div
                                    key={i}
                                    onClick={() => handleTargetClick(target, i)}
                                    className={`transition-all duration-150 ${useFullScreen ? '' : 'aspect-square rounded-md'} ${getCellClasses(target, i)}`}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {gameState === 'finished' && (
                <div className="w-full mt-8">
                     <GameResults
                        stats={stats}
                        title="Dodge & Click Results"
                        onPlayAgain={startGame}
                        onSetup={() => setGameState('setup')}
                    />
                 </div>
            )}

        </div>
    );
};

export default DodgeAndClickGame;