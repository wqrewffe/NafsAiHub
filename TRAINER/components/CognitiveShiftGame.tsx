import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { playSound } from '../utils/audio';
import Tutorial from './Tutorial';
import { calculateStats } from '../utils/stats';
import GameResults from './GameResults';
import { saveTrainerResult } from '../utils/firestore';

interface CognitiveShiftGameProps {
  onBack: () => void;
}

const tutorialSteps = [
    {
        title: 'The Goal',
        content: <p>This game tests your mental flexibility. Your goal is to correctly follow a rule that changes frequently and without warning.</p>
    },
    {
        title: 'How to Play',
        content: <p>A rule will be displayed at the top of the screen (e.g., "Click Red Circles"). You must then click on the item that matches this rule.</p>
    },
    {
        title: 'Adapt Quickly!',
        content: <p>After a few seconds, the rule will suddenly change! You need to quickly adapt to the new rule to keep scoring points.</p>
    },
    {
        title: 'Negative Rules',
        content: <p>In "Mixed" complexity, you might see negative rules like "Click anything BUT Green Squares". Read the rules carefully and stay focused!</p>
    }
];

type GameState = 'setup' | 'playing' | 'finished';
type ShapeType = 'circle' | 'square' | 'triangle';
type ColorType = 'red' | 'green' | 'blue';
type Mode = 'single' | 'grid';
type Complexity = 'positive' | 'mixed';

const SHAPES: ShapeType[] = ['circle', 'square', 'triangle'];
const COLORS: ColorType[] = ['red', 'green', 'blue'];
const COLOR_MAP: Record<ColorType, string> = { red: '#EF4444', green: '#22C55E', blue: '#3B82F6' };

interface Item {
  shape: ShapeType;
  color: ColorType;
}

interface Rule {
  item: Item;
  isNegative: boolean;
  description: string;
}

// Rewritten for robustness and perfect scaling using clip-path for triangle
const ShapeDisplay: React.FC<{ item: Item }> = ({ item }) => {
  const baseClasses = "w-full h-full";
  const style = { backgroundColor: COLOR_MAP[item.color] };

  if (item.shape === 'circle') {
    return <div className={`${baseClasses} rounded-full`} style={style} />;
  }
  if (item.shape === 'square') {
    return <div className={`${baseClasses} rounded-lg`} style={style} />;
  }
  if (item.shape === 'triangle') {
    return <div className={baseClasses} style={{ ...style, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />;
  }
  return null;
};


const CognitiveShiftGame: React.FC<CognitiveShiftGameProps> = ({ onBack }) => {
    const [gameState, setGameState] = useState<GameState>('setup');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [showTutorial, setShowTutorial] = useState(false);
    
    // Settings
    const [duration, setDuration] = useState(60);
    const [ruleChangeInterval, setRuleChangeInterval] = useState(7);
    const [mode, setMode] = useState<Mode>('single');
    const [complexity, setComplexity] = useState<Complexity>('positive');
    const [useFullScreen, setUseFullScreen] = useState(false);

    const [rule, setRule] = useState<Rule | null>(null);
    const [gridItems, setGridItems] = useState<Item[]>([]);
    const [feedback, setFeedback] = useState<{ index: number, type: 'correct' | 'incorrect' } | null>(null);
    const [reactionTimes, setReactionTimes] = useState<number[]>([]);
    const [hits, setHits] = useState(0);
    const [misses, setMisses] = useState(0);

    const reactionStartRef = useRef<number>(0);

    const generateRule = useCallback(() => {
        const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const isNegative = complexity === 'mixed' && Math.random() > 0.6;
        const colorText = color.charAt(0).toUpperCase() + color.slice(1);
        const shapeText = shape.charAt(0).toUpperCase() + shape.slice(1) + 's';
        const description = isNegative ? `Click anything BUT ${colorText} ${shapeText}` : `Click ${colorText} ${shapeText}`;
        setRule({ item: { shape, color }, isNegative, description });
    }, [complexity]);

    const generateItems = useCallback(() => {
        if (!rule) return;
        let items: Item[] = [];
        const numItems = mode === 'grid' ? 4 : 1;

        for (let i = 0; i < numItems; i++) {
            let item: Item;
            if (mode === 'grid' && rule.isNegative && i === 0) {
                 do {
                    item = {
                        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
                        color: COLORS[Math.floor(Math.random() * COLORS.length)],
                    };
                } while (item.shape === rule.item.shape && item.color === rule.item.color);
            } else {
                 item = {
                    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                };
            }
            items.push(item);
        }

        if (mode === 'grid' && !rule.isNegative && !items.some(it => it.shape === rule.item.shape && it.color === rule.item.color)) {
            items[Math.floor(Math.random() * numItems)] = rule.item;
        }

        setGridItems(items);
        reactionStartRef.current = performance.now();
    }, [rule, mode]);

    useEffect(() => {
        if (gameState !== 'playing') return;
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            playSound('end');
            setGameState('finished');
        }
    }, [gameState, timeLeft]);

    useEffect(() => {
        if (gameState !== 'playing') return;
        generateRule();
        const ruleTimer = setInterval(() => {
            playSound('change');
            generateRule();
        }, ruleChangeInterval * 1000);
        return () => clearInterval(ruleTimer);
    }, [gameState, ruleChangeInterval, generateRule]);
    
    useEffect(() => {
        if(gameState === 'playing') generateItems();
    }, [rule, gameState, generateItems]);
    
    const handleItemClick = (item: Item, index: number) => {
        if (feedback || !rule) return;
        const isMatch = item.shape === rule.item.shape && item.color === rule.item.color;
        const isCorrect = rule.isNegative ? !isMatch : isMatch;
        
        if (isCorrect) {
            playSound('correct');
            const reactionTime = performance.now() - reactionStartRef.current;
            setReactionTimes(prev => [...prev, reactionTime]);
            setHits(h => h + 1);
            setScore(s => s + 15);
            setFeedback({ index, type: 'correct' });
        } else {
            playSound('incorrect');
            setMisses(m => m + 1);
            setScore(s => s - 10);
            setFeedback({ index, type: 'incorrect' });
        }

        setTimeout(() => {
            setFeedback(null);
            generateItems();
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
    };

    const stats = useMemo(() => calculateStats(reactionTimes, hits, misses, duration, 15), [reactionTimes, hits, misses, duration]);

    useEffect(() => {
        if (gameState === 'finished') {
            saveTrainerResult('cognitive-shift', stats).catch(err => console.error('Failed saving cognitive-shift result', err));
        }
    }, [gameState, stats]);

    return (
        <div className="w-full max-w-4xl flex flex-col items-center animate-fade-in p-2 sm:p-4">
            {showTutorial && <Tutorial steps={tutorialSteps} onClose={() => setShowTutorial(false)} />}
            {!useFullScreen && (
                <div className="w-full flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr] items-center gap-4 mb-4">
                  <div className="w-full sm:w-auto sm:justify-self-start z-10">
                    <button onClick={onBack} className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 text-base">&larr; Change Mode</button>
                  </div>
                  <div className="text-center order-first sm:order-none">
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-orbitron text-red-500">Cognitive Shift</h1>
                      <p className="text-gray-400 mt-1 text-sm sm:text-base">Test your mental flexibility.</p>
                  </div>
                  <div />
                </div>
            )}
            
             {useFullScreen && gameState === 'playing' && (
                <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-6 bg-gray-900 bg-opacity-75 p-2 sm:p-3 rounded-lg shadow-lg">
                    <div className="flex gap-4 text-lg sm:text-2xl font-orbitron">
                        <p>Time: <span className="text-yellow-400">{timeLeft}</span></p>
                        <p>Score: <span className={`${score >= 0 ? 'text-green-400' : 'text-red-500'}`}>{score}</span></p>
                    </div>
                    <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-1 px-3 sm:py-2 sm:px-4 rounded-lg transition-colors text-sm sm:text-base">&larr; Exit</button>
                </div>
            )}

            {gameState === 'setup' && (
                <div className="text-center w-full max-w-2xl animate-fade-in mt-4">
                    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg space-y-5">
                        <div className="text-center pb-4 border-b border-gray-700">
                             <h2 className="text-xl sm:text-2xl font-orbitron text-white">Cognitive Target: Cognitive Flexibility</h2>
                             <p className="text-gray-400 mt-2 text-sm sm:text-base">This task measures your ability to shift your thinking between different concepts or rules, strengthening a cornerstone of executive function.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="text-lg font-bold text-white block mb-2">Mode</label>
                                <div className="flex justify-center gap-2 sm:gap-4 flex-wrap">{(['single', 'grid'] as const).map(m => <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 rounded-lg font-semibold text-base capitalize transition-colors ${mode === m ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{m}</button>)}</div>
                            </div>
                             <div>
                                <label className="text-lg font-bold text-white block mb-2">Rule Complexity</label>
                                <div className="flex justify-center gap-2 sm:gap-4 flex-wrap">{(['positive', 'mixed'] as const).map(c => <button key={c} onClick={() => setComplexity(c)} className={`px-4 py-2 rounded-lg font-semibold text-base capitalize transition-colors ${complexity === c ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{c}</button>)}</div>
                            </div>
                            <div>
                                <label className="text-lg font-bold text-white block mb-2">Duration</label>
                                <div className="flex justify-center gap-2 sm:gap-4 flex-wrap">{[30, 60, 90].map(sec => <button key={sec} onClick={() => setDuration(sec)} className={`px-4 py-2 rounded-lg font-semibold text-base transition-colors ${duration === sec ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{sec}s</button>)}</div>
                            </div>
                            <div>
                                <label className="text-lg font-bold text-white block mb-2">Rule Change Speed</label>
                                <div className="flex justify-center gap-2 sm:gap-4 flex-wrap">{[{ v: 10, l: 'Slow' }, { v: 7, l: 'Normal' }, { v: 4, l: 'Fast' }, { v: 2, l: 'Elite' }].map(i => <button key={i.v} onClick={() => setRuleChangeInterval(i.v)} className={`px-4 py-2 rounded-lg font-semibold text-base transition-colors ${ruleChangeInterval === i.v ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{i.l}</button>)}</div>
                            </div>
                             <div className="col-span-1 md:col-span-2">
                                <label className="text-lg font-bold text-white block mb-2">Display Mode</label>
                                <div className="flex justify-center gap-2 sm:gap-4">
                                    <button onClick={() => setUseFullScreen(false)} className={`px-4 py-2 rounded-lg font-semibold text-base transition-colors ${!useFullScreen ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Contained</button>
                                    <button onClick={() => setUseFullScreen(true)} className={`px-4 py-2 rounded-lg font-semibold text-base transition-colors ${useFullScreen ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Full Display</button>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button onClick={() => setShowTutorial(true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-lg font-orbitron transition-transform transform hover:scale-105">How to Play</button>
                            <button onClick={startGame} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg text-lg font-orbitron transition-transform transform hover:scale-105">Start</button>
                        </div>
                    </div>
                </div>
            )}
            
            {(gameState === 'playing' && rule) && (
                <div className={`w-full flex flex-col items-center ${useFullScreen ? 'fixed inset-0 z-40 bg-gray-900' : ''}`}>
                    <div className={`${useFullScreen ? 'w-full h-full' : 'w-full min-h-[24rem] sm:h-96 bg-gray-800 rounded-lg'} flex flex-col items-center justify-center p-4 relative`}>
                        {!useFullScreen && (
                            <div className="flex justify-between w-full text-xl sm:text-2xl font-orbitron mb-4 absolute top-2 sm:top-4 px-4">
                                <p>Time: <span className="text-yellow-400">{timeLeft}</span></p>
                                <p>Score: <span className={`${score >= 0 ? 'text-green-400' : 'text-red-500'}`}>{score}</span></p>
                            </div>
                        )}
                         <div key={rule.description} className="text-center mb-4 sm:mb-6 h-16 animate-pop-in">
                            <p className="text-gray-400 text-base sm:text-lg">Current Rule:</p>
                            <p className="text-2xl sm:text-3xl font-bold font-orbitron text-white text-balance">{rule.description}</p>
                        </div>
                        <div className={`flex items-center justify-center ${mode === 'grid' ? `grid grid-cols-2 gap-4 sm:gap-6 ${useFullScreen ? 'md:gap-12' : ''}` : ''}`}>
                          {gridItems.map((item, index) => {
                            const sizeClass = useFullScreen
                                ? (mode === 'grid' ? 'w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40' : 'w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48')
                                : (mode === 'grid' ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-24 h-24 sm:w-28 sm:h-28');

                            return (
                              <div 
                                  key={index}
                                  className={`cursor-pointer transition-all duration-200 flex justify-center items-center
                                      ${feedback?.index === index && feedback.type === 'correct' ? 'scale-110' : ''} 
                                      ${feedback?.index === index && feedback.type === 'incorrect' ? 'animate-shake' : ''}
                                      ${sizeClass}`
                                  }
                                  onClick={() => handleItemClick(item, index)}
                              >
                                  <ShapeDisplay item={item} />
                              </div>
                            );
                           })}
                        </div>
                    </div>
                </div>
            )}

            {gameState === 'finished' && (
                <div className="w-full mt-4 sm:mt-8">
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

export default CognitiveShiftGame;