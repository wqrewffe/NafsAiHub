import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playSound } from '../utils/audio';
import Tutorial from './Tutorial';

interface DigitSpanGameProps {
  onBack: () => void;
}

const tutorialSteps = [
    {
        title: 'The Goal',
        content: <p>This is a classic test of working memory. Your goal is to memorize a sequence of digits and recall it correctly.</p>
    },
    {
        title: 'Step 1: Memorize',
        content: <p>At the start of each level, a sequence of numbers will be shown to you one digit at a time. Concentrate and commit them to memory.</p>
    },
    {
        title: 'Step 2: Recall',
        content: <p>After the sequence is shown, you will be prompted to type it into the input box and press "Submit".</p>
    },
    {
        title: 'Reverse Mode',
        content: <p>For a greater challenge, select "Reverse" mode. You will need to recall the sequence in <strong>backwards order</strong>.</p>
    },
    {
        title: 'Progression',
        content: <p>If you are correct, the sequence gets one digit longer. The game ends when you make a mistake. Your score is the longest sequence you successfully remembered.</p>
    }
];

type GameState = 'setup' | 'showing' | 'inputting' | 'finished';
type DisplayState = 'digit' | 'mask' | 'blank';

const DigitSpanGame: React.FC<DigitSpanGameProps> = ({ onBack }) => {
    const [gameState, setGameState] = useState<GameState>('setup');
    const [sequence, setSequence] = useState('');
    const [userInput, setUserInput] = useState('');
    const [level, setLevel] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [showTutorial, setShowTutorial] = useState(false);
    
    // Display state for showing sequence
    const [displayState, setDisplayState] = useState<DisplayState>('blank');
    const [currentDigitIndex, setCurrentDigitIndex] = useState(0);

    // Settings
    const [startLevel, setStartLevel] = useState(3);
    const [speed, setSpeed] = useState(1000); // ms per digit
    const [mode, setMode] = useState<'forward' | 'reverse'>('forward');
    const [useMasking, setUseMasking] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    const generateSequence = useCallback((length: number) => {
        let newSequence = '';
        for (let i = 0; i < length; i++) {
            newSequence += Math.floor(Math.random() * 10);
        }
        setSequence(newSequence);
    }, []);
    
    const startNextLevel = useCallback(() => {
        setUserInput('');
        setFeedback(null);
        setCurrentDigitIndex(0);
        const nextLevel = level === 0 ? startLevel : level + 1;
        setLevel(nextLevel);
        generateSequence(nextLevel);
        setGameState('showing');
    }, [level, startLevel, generateSequence]);

    useEffect(() => {
        if (gameState === 'showing' && sequence) {
            setDisplayState('digit');
            playSound('tick');
            const interval = setInterval(() => {
                setCurrentDigitIndex(i => {
                    if (i < sequence.length - 1) {
                        if (useMasking) setDisplayState('mask');
                        setTimeout(() => {
                            setDisplayState('digit');
                            playSound('tick');
                        }, useMasking ? 200 : 0);
                        return i + 1;
                    } else {
                        clearInterval(interval);
                        setTimeout(() => {
                             setDisplayState('blank');
                             setGameState('inputting');
                        }, speed);
                        return i;
                    }
                });
            }, speed);
            return () => clearInterval(interval);
        }
    }, [gameState, sequence, speed, useMasking]);

    useEffect(() => {
        if (gameState === 'inputting' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [gameState]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const correctSequence = mode === 'reverse' ? [...sequence].reverse().join('') : sequence;

        if (userInput === correctSequence) {
            playSound('correct');
            setFeedback('correct');
            setTimeout(startNextLevel, 500);
        } else {
            playSound('incorrect');
            setFeedback('incorrect');
            playSound('end');
            setGameState('finished');
        }
    };
    
    const startGame = () => {
        playSound('start');
        setLevel(0);
        setTimeout(startNextLevel, 300);
    };

    return (
        <div className="w-full max-w-2xl flex flex-col items-center animate-fade-in p-2 sm:p-4">
            {showTutorial && <Tutorial steps={tutorialSteps} onClose={() => setShowTutorial(false)} />}
             <div className="w-full flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr] items-center gap-4 mb-4">
                <div className="w-full sm:w-auto sm:justify-self-start z-10">
                  <button onClick={onBack} className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 text-base">
                    &larr; Change Mode
                  </button>
                </div>
                <div className="text-center order-first sm:order-none">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-orbitron text-red-500">Digit Span</h1>
                    <p className="text-gray-400 mt-1 text-sm sm:text-base">Test your working memory capacity.</p>
                </div>
                <div />
            </div>

            {gameState === 'setup' && (
                <div className="text-center w-full max-w-lg animate-fade-in mt-4">
                    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg space-y-5">
                        <div className="text-center pb-4 border-b border-gray-700">
                             <h2 className="text-xl sm:text-2xl font-orbitron text-white">Cognitive Target: Working Memory</h2>
                             <p className="text-gray-400 mt-2 text-sm sm:text-base">This test measures working memory capacity by requiring you to hold an increasing amount of information in your mind for a short period.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="text-lg font-bold text-white block mb-2">Mode</label>
                                <div className="flex justify-center gap-2 sm:gap-4 flex-wrap">{(['forward', 'reverse'] as const).map(m => <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 rounded-lg font-semibold text-base capitalize transition-colors ${mode === m ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{m}</button>)}</div>
                            </div>
                            <div>
                                <label className="text-lg font-bold text-white block mb-2">Starting Length</label>
                                <div className="flex justify-center gap-2 sm:gap-4 flex-wrap">{[3, 4, 5].map(len => <button key={len} onClick={() => setStartLevel(len)} className={`px-4 py-2 rounded-lg font-semibold text-base transition-colors ${startLevel === len ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{len}</button>)}</div>
                            </div>
                            <div>
                                <label className="text-lg font-bold text-white block mb-2">Display Speed</label>
                                <div className="flex justify-center gap-2 sm:gap-4 flex-wrap">{[{s:1200, l:'Slow'}, {s:1000, l:'Normal'}, {s:700, l:'Fast'}].map(item => <button key={item.s} onClick={() => setSpeed(item.s)} className={`px-4 py-2 rounded-lg font-semibold text-base transition-colors ${speed === item.s ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{item.l}</button>)}</div>
                            </div>
                             <div>
                                <label className="text-lg font-bold text-white block mb-2">Elite Mode</label>
                                <button onClick={() => setUseMasking(m => !m)} className={`w-full px-4 py-2 rounded-lg font-semibold text-base transition-colors capitalize ${useMasking ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{useMasking ? 'Masking ON' : 'Masking OFF'}</button>
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
            
            {gameState !== 'setup' && gameState !== 'finished' && (
                <div className="w-full flex flex-col items-center">
                    <p className="text-2xl sm:text-3xl font-orbitron mb-4">Sequence Length: <span className="text-yellow-400">{level}</span></p>
                    <div className="w-full min-h-[14rem] sm:min-h-[16rem] bg-gray-800 rounded-lg flex items-center justify-center p-4">
                       {gameState === 'showing' && (
                           <p className="text-8xl sm:text-9xl font-bold font-orbitron text-white tracking-widest animate-fade-in">
                               {displayState === 'digit' ? sequence[currentDigitIndex] : displayState === 'mask' ? '#' : ''}
                           </p>
                       )}
                       {gameState === 'inputting' && (
                           <form onSubmit={handleSubmit} className="w-full max-w-sm text-center">
                               <label htmlFor="sequenceInput" className="text-lg sm:text-xl text-gray-400 mb-2 block">Enter the sequence {mode === 'reverse' && '(in REVERSE)'}</label>
                               <input
                                  id="sequenceInput"
                                  ref={inputRef}
                                  type="text"
                                  pattern="[0-9]*"
                                  inputMode="numeric"
                                  value={userInput}
                                  onChange={(e) => setUserInput(e.target.value)}
                                  className={`w-full bg-gray-900 text-white font-bold text-center text-5xl sm:text-6xl font-orbitron py-2 sm:py-3 rounded-lg border-4 focus:outline-none focus:ring-4 transition-all
                                    ${feedback === 'correct' ? 'border-green-500 ring-green-500/50' : ''}
                                    ${feedback === 'incorrect' ? 'border-red-500 ring-red-500/50' : 'border-gray-700 focus:border-red-500 focus:ring-red-500/50'}`}
                                />
                                <button type="submit" className="mt-6 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg text-lg sm:text-xl transition-colors">Submit</button>
                           </form>
                       )}
                    </div>
                </div>
            )}

            {gameState === 'finished' && (
                <div className="text-center w-full animate-fade-in mt-8">
                    <h2 className="text-3xl sm:text-4xl font-bold font-orbitron text-red-500 mb-4">Game Over</h2>
                    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg">
                        <p className="text-gray-400 text-lg sm:text-xl">Your {mode} digit span is</p>
                        <p className="font-bold text-6xl sm:text-7xl text-yellow-400 font-orbitron my-2">{level > 0 ? level - 1 : 0}</p>
                        <p className="text-gray-400 text-sm sm:text-base mt-2">The average for adults is ~7 forward, ~5 reverse.</p>
                    </div>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={startGame} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg text-lg sm:text-xl transition-colors">Play Again</button>
                        <button onClick={() => setGameState('setup')} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg text-lg sm:text-xl transition-colors">Change Settings</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DigitSpanGame;