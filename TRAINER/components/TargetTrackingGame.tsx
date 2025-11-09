import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { playSound } from '../utils/audio';
import Tutorial from './Tutorial';
import { calculateStats } from '../utils/stats';
import GameResults from './GameResults';

interface TargetTrackingGameProps {
  onBack: () => void;
}

const tutorialSteps = [
    {
        title: 'Hunter vs. Prey',
        content: <p>This is an advanced tracking and avoidance game. You control the large blue tracking beam with your cursor.</p>
    },
    {
        title: 'The Goal: Track the Prey',
        content: <p>Your primary objective is to keep your tracking beam centered on the green "Prey" target. The prey is evasive and will try to flee from you.</p>
    },
    {
        title: 'Lock-On and Score',
        content: <p>Holding your beam over the prey fills the "Lock-On Meter" at the top. When the meter is full, you score points and it resets. This rewards sustained, precise tracking.</p>
    },
    {
        title: 'Warning: Avoid Predators!',
        content: <p>The red "Predator" targets will hunt you. If they touch your tracking beam, your lock-on meter instantly resets to zero. You must track the prey while actively dodging predators.</p>
    }
];

type GameState = 'setup' | 'playing' | 'finished';
type Intensity = 'normal' | 'hard' | 'relentless';

const TARGET_SIZES = { small: 24, medium: 32, large: 40 };
const PREDATOR_SIZES = { small: 32, medium: 40, large: 50 };
const BEAM_RADIUS = 80;

interface Target {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
}

const TargetTrackingGame: React.FC<TargetTrackingGameProps> = ({ onBack }) => {
    const [gameState, setGameState] = useState<GameState>('setup');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [showTutorial, setShowTutorial] = useState(false);
    
    // Settings
    const [duration, setDuration] = useState(30);
    const [targetSize, setTargetSize] = useState<'medium' | 'small' | 'large'>('medium');
    const [intensity, setIntensity] = useState<Intensity>('normal');

    const [prey, setPrey] = useState<Target>({ id: 0, x: -100, y: -100, vx: 2, vy: 2 });
    const [predators, setPredators] = useState<Target[]>([]);
    const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
    const [lockOnMeter, setLockOnMeter] = useState(0);
    const [feedback, setFeedback] = useState<{ type: 'hit' | 'miss', x: number, y: number, id: number } | null>(null);
    const [shake, setShake] = useState(false);
    const [lockOnTimestamps, setLockOnTimestamps] = useState<number[]>([]);

    const gameAreaRef = useRef<HTMLDivElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const getIntensityConfig = useCallback(() => {
        switch (intensity) {
            case 'hard': return { preySpeed: 4, predatorCount: 3, predatorSpeed: 0.8 };
            case 'relentless': return { preySpeed: 5, predatorCount: 5, predatorSpeed: 1.2 };
            case 'normal':
            default: return { preySpeed: 3, predatorCount: 2, predatorSpeed: 0.5 };
        }
    }, [intensity]);

    // Countdown Timer
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

    const createFeedback = (type: 'hit' | 'miss', x: number, y: number) => {
        const id = Date.now();
        setFeedback({ type, x, y, id });
        setTimeout(() => setFeedback(f => (f?.id === id ? null : f)), 500);
    };

    // Game Loop
    const gameLoop = useCallback(() => {
        if (!gameAreaRef.current) return;
        const rect = gameAreaRef.current.getBoundingClientRect();
        const config = getIntensityConfig();
        const preySize = TARGET_SIZES[targetSize];
        const predatorSize = PREDATOR_SIZES[targetSize];

        // --- Prey Logic ---
        setPrey(p => {
            let { x, y, vx, vy } = p;
            const cursorDistance = Math.sqrt(Math.pow(x - cursorPos.x, 2) + Math.pow(y - cursorPos.y, 2));
            
            if (cursorDistance < BEAM_RADIUS * 1.5) {
                const angle = Math.atan2(y - cursorPos.y, x - cursorPos.x);
                vx += Math.cos(angle) * 0.5;
                vy += Math.sin(angle) * 0.5;
            }

            vx += (Math.random() - 0.5) * 0.4;
            vy += (Math.random() - 0.5) * 0.4;

            const speed = Math.sqrt(vx*vx + vy*vy);
            if(speed > config.preySpeed) {
                vx = (vx / speed) * config.preySpeed;
                vy = (vy / speed) * config.preySpeed;
            }

            x += vx;
            y += vy;
            if (x <= 0 || x >= rect.width - preySize) vx = -vx;
            if (y <= 0 || y >= rect.height - preySize) vy = -vy;

            return { ...p, x: Math.max(0, Math.min(x, rect.width - preySize)), y: Math.max(0, Math.min(y, rect.height - preySize)), vx, vy };
        });

        // --- Predator Logic ---
        setPredators(preds => preds.map(p => {
             let { x, y, vx, vy } = p;
             const angle = Math.atan2(cursorPos.y - y, cursorPos.x - x);
             vx += Math.cos(angle) * 0.1;
             vy += Math.sin(angle) * 0.1;

            const speed = Math.sqrt(vx*vx + vy*vy);
            if(speed > config.predatorSpeed) {
                vx = (vx / speed) * config.predatorSpeed;
                vy = (vy / speed) * config.predatorSpeed;
            }

             x += vx;
             y += vy;
             if (x <= 0 || x >= rect.width - predatorSize) vx = -vx;
             if (y <= 0 || y >= rect.height - predatorSize) vy = -vy;

             return { ...p, x: Math.max(0, Math.min(x, rect.width - predatorSize)), y: Math.max(0, Math.min(y, rect.height - predatorSize)), vx, vy };
        }));

        // --- Collision & Scoring Logic ---
        const preyDistance = Math.sqrt(Math.pow(prey.x + preySize/2 - cursorPos.x, 2) + Math.pow(prey.y + preySize/2 - cursorPos.y, 2));
        const isTrackingPrey = preyDistance < BEAM_RADIUS;

        let hitPredator = false;
        for(const p of predators) {
            const predatorDistance = Math.sqrt(Math.pow(p.x + predatorSize/2 - cursorPos.x, 2) + Math.pow(p.y + predatorSize/2 - cursorPos.y, 2));
            if (predatorDistance < BEAM_RADIUS - 20) {
                hitPredator = true;
                break;
            }
        }

        if (hitPredator) {
            if (lockOnMeter > 0) playSound('miss');
            setLockOnMeter(0);
            setShake(true);
            setTimeout(() => setShake(false), 300);
        } else if (isTrackingPrey) {
            setLockOnMeter(meter => {
                const newMeter = Math.min(100, meter + 1.5);
                if (newMeter >= 100) {
                    playSound('hit');
                    setScore(s => s + 100);
                    setLockOnTimestamps(prev => [...prev, performance.now()]);
                    createFeedback('hit', prey.x, prey.y);
                    return 0;
                }
                return newMeter;
            });
        } else {
            setLockOnMeter(meter => Math.max(0, meter - 0.5));
        }
        
        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, [cursorPos, getIntensityConfig, targetSize, prey, predators, lockOnMeter]);

    const startGame = () => {
        playSound('start');
        setScore(0);
        setTimeLeft(duration);
        setLockOnMeter(0);
        setPredators([]);
        setLockOnTimestamps([]);
        setPrey(p => ({ ...p, x: -100, y: -100 }));
        setGameState('playing');
    };

    useEffect(() => {
        if (gameState === 'playing') {
            if (prey.x < 0 && gameAreaRef.current) {
                const rect = gameAreaRef.current.getBoundingClientRect();
                const config = getIntensityConfig();
                
                setPrey({ id: 0, x: rect.width / 2, y: rect.height / 2, vx: config.preySpeed, vy: config.preySpeed });
                
                const newPredators: Target[] = [];
                for (let i = 0; i < config.predatorCount; i++) {
                    newPredators.push({
                        id: i + 1,
                        x: Math.random() * rect.width,
                        y: Math.random() * rect.height,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2
                    });
                }
                setPredators(newPredators);
                return;
            }

            if (prey.x >= 0) {
              animationFrameId.current = requestAnimationFrame(gameLoop);
            }
        }

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
        };
    }, [gameState, gameLoop, getIntensityConfig, prey.x]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!gameAreaRef.current) return;
        const rect = gameAreaRef.current.getBoundingClientRect();
        setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const stats = useMemo(() => {
        if (lockOnTimestamps.length < 2) {
            return calculateStats([], score/100, 0, duration, 100);
        }
        const lockOnIntervals: number[] = [];
        for (let i = 1; i < lockOnTimestamps.length; i++) {
            lockOnIntervals.push(lockOnTimestamps[i] - lockOnTimestamps[i-1]);
        }
        const customStats = calculateStats(lockOnIntervals, score/100, 0, duration, 100);
        customStats.finalScore = score;
        return customStats;
    }, [lockOnTimestamps, score, duration]);

    return (
        <div className="w-full max-w-4xl flex flex-col items-center animate-fade-in p-4 md:p-0">
            {showTutorial && <Tutorial steps={tutorialSteps} onClose={() => setShowTutorial(false)} />}
            
            <div className="w-full grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-4">
                <div className="flex justify-self-start z-10">
                    <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 text-sm md:text-base">&larr; Change Mode</button>
                </div>
                <div className="text-center">
                    <h1 className="text-3xl md:text-4xl font-bold font-orbitron text-red-500">Target Hunter</h1>
                    <p className="text-gray-400 mt-1 text-sm md:text-base">Track the prey, avoid the predators.</p>
                </div>
                <div />
            </div>

            {gameState === 'setup' && (
                <div className="text-center w-full max-w-lg animate-fade-in mt-4">
                    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
                        <div className="text-center pb-4 border-b border-gray-700">
                            <h2 className="text-xl md:text-2xl font-orbitron text-white">Cognitive Target: Predictive Tracking</h2>
                            <p className="text-gray-300 mt-2 text-sm">This drill hones sustained attention and visuomotor control. Maintain focus on an evasive target while avoiding hunting threats.</p>
                        </div>
                        <div>
                            <label className="text-lg font-bold text-white block mb-2">Intensity</label>
                            <div className="flex justify-center gap-2 md:gap-4">{(['normal', 'hard', 'relentless'] as const).map(i => <button key={i} onClick={() => setIntensity(i)} className={`px-4 py-2 rounded-lg font-bold text-base capitalize transition-colors ${intensity === i ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{i}</button>)}</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="text-lg font-bold text-white block mb-2">Duration</label>
                                <div className="flex justify-center gap-2">{[30, 45, 60].map(sec => <button key={sec} onClick={() => setDuration(sec)} className={`px-4 py-1.5 rounded-lg font-bold text-sm transition-colors ${duration === sec ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{sec}s</button>)}</div>
                            </div>
                            <div>
                                <label className="text-lg font-bold text-white block mb-2">Prey Size</label>
                                <div className="flex justify-center gap-2">{(['small', 'medium', 'large'] as const).map(size => <button key={size} onClick={() => setTargetSize(size)} className={`px-4 py-1.5 rounded-lg font-bold text-sm capitalize transition-colors ${targetSize === size ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{size}</button>)}</div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button onClick={() => setShowTutorial(true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-lg font-orbitron transition-colors">
                                How to Play
                            </button>
                            <button onClick={startGame} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg text-lg font-orbitron transition-colors">
                                Start
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {gameState === 'playing' && (
                <div className="w-full flex flex-col items-center">
                    <div className="flex justify-between w-full text-2xl md:text-3xl font-orbitron my-2 md:my-4">
                        <p>Time: <span className="text-yellow-400">{timeLeft}</span></p>
                        <p>Score: <span className="text-green-400">{score}</span></p>
                    </div>
                    <div ref={gameAreaRef} 
                         className={`relative cursor-none overflow-hidden w-full aspect-video max-h-[75vh] bg-gray-800 rounded-lg shadow-lg
                                    ${shake ? 'animate-shake' : ''} 
                                    ${intensity === 'relentless' ? 'border-2 border-red-800 animate-pulse' : 'border-2 border-gray-700'}`}
                         onMouseMove={handleMouseMove}
                    >
                         <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-2/3 max-w-xs h-3 bg-gray-900 rounded-full overflow-hidden">
                             <div className="h-full bg-cyan-400 transition-all duration-100" style={{width: `${lockOnMeter}%`}} />
                         </div>

                         {feedback && feedback.type === 'hit' && (
                             <div key={feedback.id} className="absolute text-cyan-400 text-2xl font-bold animate-fade-out pointer-events-none" style={{ left: feedback.x, top: feedback.y }}>+100</div>
                         )}

                        <div
                            className="absolute bg-green-500 rounded-full shadow-glow-green animate-pulse"
                            style={{
                                top: `${prey.y}px`,
                                left: `${prey.x}px`,
                                width: `${TARGET_SIZES[targetSize]}px`,
                                height: `${TARGET_SIZES[targetSize]}px`,
                            }}
                        />

                        {predators.map(p => (
                            <div key={p.id} className="absolute" style={{ top: `${p.y}px`, left: `${p.x}px`, width: `${PREDATOR_SIZES[targetSize]}px`, height: `${PREDATOR_SIZES[targetSize]}px` }}>
                                 <svg viewBox="0 0 100 100" fill="#EF4444" className="animate-spin" style={{animationDuration: '5s'}}>
                                    <path d="M50 0 L100 50 L50 100 L0 50 Z" />
                                 </svg>
                            </div>
                        ))}
                        
                        <div className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2" style={{ left: cursorPos.x, top: cursorPos.y }}>
                             <div className="w-40 h-40 rounded-full bg-cyan-400 bg-opacity-10 border-2 border-cyan-400" style={{width: `${BEAM_RADIUS * 2}px`, height: `${BEAM_RADIUS * 2}px`}} />
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                    </div>
                </div>
            )}
            
            {gameState === 'finished' && (
                <div className="w-full mt-8">
                    <GameResults
                        stats={stats}
                        title="Finished!"
                        subtitle="Time to Lock-On (ms)"
                        onPlayAgain={startGame}
                        onSetup={() => setGameState('setup')}
                    />
                </div>
            )}
        </div>
    );
};

export default TargetTrackingGame;