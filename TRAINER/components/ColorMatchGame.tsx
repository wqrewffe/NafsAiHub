import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { playSound } from '../utils/audio';
import Tutorial from './Tutorial';
import { calculateStats } from '../utils/stats';
import GameResults from './GameResults';
import { saveTrainerResult } from '../utils/firestore';

interface ColorMatchGameProps {
  onBack: () => void;
}

const tutorialSteps = [
    {
        title: 'The Goal',
        content: <div><p>This is a test of your mental flexibility, based on the classic Stroop Effect.</p><p className="mt-2">Your task is to identify the <strong>color of the ink</strong> the word is written in, and ignore what the word says.</p></div>
    },
    {
        title: 'How to Play',
        content: <p>Look at the large word in the center. Then, click the colored square below that matches the color of the text.</p>
    },
    {
        title: 'Example',
        content: <div className="text-center"><p>If you see the word:</p><p className="text-5xl font-bold my-2" style={{ color: '#3b82f6' }}>RED</p><p>...you should click the <strong>BLUE</strong> square, because the ink is blue.</p></div>
    },
    {
        title: 'Scoring',
        content: <p>You get points for correct answers and lose points for incorrect ones. See how high you can score before time runs out!</p>
    }
];

type GameState = 'setup' | 'playing' | 'finished';

const COLOR_MAP: {[key: string]: string} = {
    'red': '#ef4444',
    'blue': '#3b82f6',
    'green': '#22c55e',
    'yellow': '#eab308',
    'purple': '#8b5cf6',
    'pink': '#ec4899',
};
const ALL_COLOR_NAMES = Object.keys(COLOR_MAP);

const ColorMatchGame: React.FC<ColorMatchGameProps> = ({ onBack }) => {
    const [gameState, setGameState] = useState<GameState>('setup');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [prompt, setPrompt] = useState({ word: 'red', color: 'blue' });
    const [gridColors, setGridColors] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<{ color: string, type: 'correct' | 'incorrect' } | null>(null);
    const [showTutorial, setShowTutorial] = useState(false);
    const [reactionTimes, setReactionTimes] = useState<number[]>([]);
    const [hits, setHits] = useState(0);
    const [misses, setMisses] = useState(0);
    
    // Settings
    const [duration, setDuration] = useState(30);
    const [numColors, setNumColors] = useState(4);

    const reactionStartRef = useRef<number>(0);
    const currentColorNames = useMemo(() => ALL_COLOR_NAMES.slice(0, numColors), [numColors]);

    const generateNewRound = useCallback(() => {
        const word = currentColorNames[Math.floor(Math.random() * currentColorNames.length)];
        let color;
        do {
            color = currentColorNames[Math.floor(Math.random() * currentColorNames.length)];
        } while (color === word && Math.random() < 0.75); // 75% chance the color is different from the word
        setPrompt({ word, color });

        const shuffledColors = [...currentColorNames].sort(() => 0.5 - Math.random());
        setGridColors(shuffledColors);
        reactionStartRef.current = performance.now();
    }, [currentColorNames]);
    
    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
            return () => clearTimeout(timer);
        }
        if (timeLeft === 0 && gameState === 'playing') {
            playSound('end');
            setGameState('finished');
        }
    }, [gameState, timeLeft]);

    const handleCellClick = (color: string) => {
        if (feedback) return;
        const isCorrect = color === prompt.color;

        if (isCorrect) {
            playSound('correct');
            const reactionTime = performance.now() - reactionStartRef.current;
            setReactionTimes(prev => [...prev, reactionTime]);
            setHits(h => h + 1);
            setScore(s => s + 10);
            setFeedback({ color, type: 'correct' });
        } else {
            playSound('incorrect');
            setMisses(m => m + 1);
            setScore(s => s - 5);
            setFeedback({ color, type: 'incorrect' });
        }
        setTimeout(() => {
            setFeedback(null);
            generateNewRound();
        }, 300);
    };
    
    const startGame = () => {
        playSound('start');
        setScore(0);
        setHits(0);
        setMisses(0);
        setReactionTimes([]);
        setTimeLeft(duration);
        setGameState('playing');
        generateNewRound();
    };

    const stats = useMemo(() => calculateStats(reactionTimes, hits, misses, duration), [reactionTimes, hits, misses, duration]);

    useEffect(() => {
        if (gameState === 'finished') {
            saveTrainerResult('color-match', stats).catch(err => console.warn('Failed saving color-match', err));
        }
    }, [gameState, stats]);

    const gridClass = numColors === 4 ? 'grid-cols-2' : 'grid-cols-3';

    return (
         <div className="w-full max-w-2xl flex flex-col items-center animate-fade-in p-2 sm:p-4">
            {showTutorial && <Tutorial steps={tutorialSteps} onClose={() => setShowTutorial(false)} />}
            <div className="w-full flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr] items-center gap-4 mb-4">
                <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:justify-self-start z-10">
                    <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-base" aria-label="Go back to mode selection">
                        &larr; Change Mode
                    </button>
                    {gameState === 'playing' && (
                        <button onClick={startGame} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-base" aria-label="Reset Game">
                            Reset
                        </button>
                    )}
                </div>
                <div className="text-center order-first sm:order-none">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-orbitron text-red-500">Color Match</h1>
                    <p className="text-gray-400 mt-1 text-sm sm:text-base text-balance">Train your executive functions and interference resistance.</p>
                </div>
                <div />
            </div>
            
            {gameState === 'setup' && (
                <div className="text-center w-full max-w-lg animate-fade-in mt-4">
                    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg space-y-5">
                        <div className="text-center pb-4 border-b border-gray-700">
                            <h2 className="text-xl sm:text-2xl font-orbitron text-white">Cognitive Target: Inhibitory Control</h2>
                            <p className="text-gray-400 mt-2 text-sm sm:text-base">This test, based on the Stroop effect, measures your ability to suppress a dominant response (reading) in favor of a less automatic one (naming the color).</p>
                        </div>
                        <div>
                            <label className="text-lg font-bold text-white block mb-2" id="duration-label">Duration</label>
                            <div role="group" aria-labelledby="duration-label" className="flex justify-center gap-2 sm:gap-4">
                                {[15, 30, 60].map(sec => (
                                    <button key={sec} onClick={() => setDuration(sec)} className={`px-4 py-2 rounded-lg font-semibold text-base transition-colors ${duration === sec ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        {sec}s
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-lg font-bold text-white block mb-2" id="colors-label">Difficulty</label>
                            <div role="group" aria-labelledby="colors-label" className="flex justify-center gap-2 sm:gap-4">
                                {[4, 6].map(num => (
                                    <button key={num} onClick={() => setNumColors(num)} className={`px-4 py-2 rounded-lg font-semibold text-base transition-colors ${numColors === num ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        {num} Colors
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
                <div className="w-full flex flex-col items-center">
                    <div className="flex justify-between w-full text-xl sm:text-2xl md:text-3xl font-orbitron mb-4 max-w-sm">
                        <p>Time: <span className="text-yellow-400">{timeLeft}</span></p>
                        <p>Score: <span className={`${score >= 0 ? 'text-green-400' : 'text-red-500'}`}>{score}</span></p>
                    </div>
                    <div className="my-4 sm:my-6 h-24 flex items-center justify-center">
                        <p className="text-6xl sm:text-7xl md:text-8xl font-bold text-center" style={{ color: COLOR_MAP[prompt.color] }}>{prompt.word.toUpperCase()}</p>
                    </div>
                    <div className={`grid ${gridClass} gap-2 sm:gap-3 w-full max-w-xs sm:max-w-sm mx-auto`}>
                        {gridColors.map(color => {
                             const feedbackClass = feedback?.color === color
                                ? (feedback.type === 'correct' ? 'ring-4 ring-green-400 scale-105' : 'ring-4 ring-red-500 animate-shake')
                                : 'hover:scale-105';

                            return (
                                <div
                                    key={color}
                                    onClick={() => handleCellClick(color)}
                                    className={`aspect-square rounded-lg cursor-pointer transition-all transform ${feedbackClass}`}
                                    style={{ backgroundColor: COLOR_MAP[color] }}
                                    role="button"
                                    aria-label={`Color ${color}`}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
            
            {gameState === 'finished' && (
                <div className="w-full mt-4 sm:mt-8">
                    <GameResults
                        stats={stats}
                        title="Time's Up!"
                        onPlayAgain={startGame}
                        onSetup={() => setGameState('setup')}
                    />
                </div>
            )}
        </div>
    );
};

export default ColorMatchGame;