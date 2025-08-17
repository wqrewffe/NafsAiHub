
import React, { useState, useEffect } from 'react';
import { generateText } from '../../services/geminiService';
import { useAuth } from '../../hooks/useAuth';
import { logToolUsage } from '../../services/firebaseService';
import Spinner from '../../components/Spinner';

type Feedback = {
    correctPosition: number;
    correctNumber: number;
};

type GameState = 'idle' | 'playing' | 'won' | 'lost';
type Difficulty = 'easy' | 'medium' | 'hard';

const difficulties = {
    easy: { length: 4, digits: 6, attempts: 10 },
    medium: { length: 5, digits: 7, attempts: 12 },
    hard: { length: 6, digits: 8, attempts: 15 },
};

export const renderCodeBreakerOutput = (output: string) => {
     return <p className="text-slate-400">Played a game of Code Breaker. {output}</p>;
}

const CodeBreaker: React.FC = () => {
    const [secretCode, setSecretCode] = useState('');
    const [guesses, setGuesses] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [currentGuess, setCurrentGuess] = useState('');
    const [gameState, setGameState] = useState<GameState>('idle');
    const [difficulty, setDifficulty] = useState<Difficulty>('easy');
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();
    
    const { length, digits, attempts } = difficulties[difficulty];

    const startNewGame = async () => {
        setLoading(true);
        const prompt = `Generate a secret code of ${length} unique digits using numbers from 1 to ${digits}. The result should be only the number string, with no other text.`;
        try {
            const code = await generateText(prompt);
            setSecretCode(code.trim());
            setGuesses([]);
            setFeedback([]);
            setCurrentGuess('');
            setGameState('playing');
        } catch (error) {
            console.error("Failed to start game", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGuess = async () => {
        if (currentGuess.length !== length || !/^\d+$/.test(currentGuess)) return;

        const newGuesses = [...guesses, currentGuess];
        setGuesses(newGuesses);

        let correctPosition = 0;
        let correctNumber = 0;
        const secretCodeArr = secretCode.split('');
        const currentGuessArr = currentGuess.split('');
        
        // Check for correct position
        currentGuessArr.forEach((digit, i) => {
            if (digit === secretCodeArr[i]) {
                correctPosition++;
            }
        });

        // Check for correct numbers (not in correct position)
        const secretCodeSet = new Set(secretCodeArr);
        const guessSet = new Set(currentGuessArr);
        guessSet.forEach(digit => {
            if (secretCodeSet.has(digit)) {
                correctNumber++;
            }
        });
        
        const newFeedback = [...feedback, { correctPosition, correctNumber: correctNumber - correctPosition }];
        setFeedback(newFeedback);
        
        setCurrentGuess('');

        if (correctPosition === length) {
            setGameState('won');
             if (currentUser) {
                await logToolUsage(
                    currentUser.uid,
                    { id: 'code-breaker', name: 'Code Breaker', category: 'Games & Entertainment' },
                    `New Game - ${difficulty}`,
                    `Won in ${newGuesses.length} guesses. Code was ${secretCode}.`
                );
            }
        } else if (newGuesses.length >= attempts) {
            setGameState('lost');
             if (currentUser) {
                await logToolUsage(
                    currentUser.uid,
                    { id: 'code-breaker', name: 'Code Breaker', category: 'Games & Entertainment' },
                    `New Game - ${difficulty}`,
                    `Lost. Code was ${secretCode}.`
                );
            }
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        if(value.length <= length) {
            setCurrentGuess(value);
        }
    }

    const renderGameState = () => {
        if (gameState === 'idle') {
            return (
                <div className="text-center">
                    <h3 className="text-lg font-bold mb-2">Select Difficulty</h3>
                     <div className="flex justify-center gap-3 mb-4">
                        {(Object.keys(difficulties) as Difficulty[]).map(d => (
                           <button key={d} onClick={() => setDifficulty(d)} className={`px-4 py-2 rounded-md capitalize transition-colors ${difficulty === d ? 'bg-accent text-primary font-bold' : 'bg-secondary'}`}>{d}</button>
                        ))}
                    </div>
                    <button onClick={startNewGame} className="w-full py-2 px-4 rounded-md bg-accent text-white font-medium btn-animated" disabled={loading}>
                       {loading ? <Spinner /> : 'Start New Game'}
                    </button>
                </div>
            );
        }
        
        if (gameState === 'won' || gameState === 'lost') {
            return (
                <div className="text-center p-4 bg-primary rounded-lg">
                    <h3 className={`text-3xl font-bold ${gameState === 'won' ? 'text-green-400' : 'text-red-400'}`}>
                        {gameState === 'won' ? 'You Won!' : 'Game Over!'}
                    </h3>
                    <p className="text-slate-300 mt-2">The secret code was <span className="font-bold text-accent tracking-widest">{secretCode}</span>.</p>
                    <button onClick={() => setGameState('idle')} className="mt-4 w-full py-2 px-4 rounded-md bg-accent text-white font-medium btn-animated">
                        Play Again
                    </button>
                </div>
            )
        }
        
        return (
            <div>
                 <p className="text-center text-sm text-slate-400 mb-2">Guess the {length}-digit code. Digits 1-{digits}. Attempts left: {attempts - guesses.length}</p>
                 <div className="flex gap-2">
                    <input type="text" value={currentGuess} onChange={handleInputChange} maxLength={length} className="flex-grow p-2 bg-primary border border-slate-600 rounded-md text-center text-2xl tracking-[.5em]" />
                    <button onClick={handleGuess} disabled={currentGuess.length !== length} className="px-4 py-2 rounded-md bg-accent text-white font-medium disabled:bg-slate-500 btn-animated">Guess</button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex justify-center">
            <div className="w-full max-w-md bg-secondary p-6 rounded-lg">
                <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold">Code Breaker</h2>
                </div>
                <div className="h-48 overflow-y-auto bg-primary p-2 rounded-md mb-4 space-y-2">
                    {guesses.map((g, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-800 p-2 rounded-md">
                            <span className="font-mono text-xl tracking-widest text-slate-300">{g}</span>
                            <div className="text-xs text-right">
                                <p>Correct Digit & Position: <span className="font-bold text-green-400">{feedback[i].correctPosition}</span></p>
                                <p>Correct Digit, Wrong Position: <span className="font-bold text-yellow-400">{feedback[i].correctNumber}</span></p>
                            </div>
                        </div>
                    ))}
                    {guesses.length === 0 && <p className="text-center text-slate-500 pt-16">Guess history will appear here.</p>}
                </div>
                {renderGameState()}
            </div>
        </div>
    );
};

export default CodeBreaker;
