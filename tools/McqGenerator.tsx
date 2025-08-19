import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ToolContainer from './common/ToolContainer';
import type { ToolOptionConfig } from '../types';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { CheckCircleIcon, XCircleIcon } from './Icons';
import { languageOptions } from './common/options';

// --- ICONS for Advanced Features ---
const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const LightBulbIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);
const FireIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14.5 5 16.5 8 16.5 10c0-1.995.18-2.633.5-3.5 1.144-.66 2.333.153 2.657 1.157a.5.5 0 01-.857.5A2.5 2.5 0 0017.5 10c0 2 2 4.182 2 6.5a2.5 2.5 0 11-5 0c0-.833.25-1.5.657-2.343z" />
    </svg>
);

// --- NEW AND UPDATED Interfaces ---
interface Mcq {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    topic?: string;
    difficulty?: string;
    focus?: string;
}

interface AnswerRecord {
    selected: string | null;
    question: Mcq;
    options: string[];
}

interface QuizResult {
    score: number;
    answersHistory: AnswerRecord[];
    mcqs: Mcq[];
}

function isQuizResult(item: any): item is QuizResult {
    return item && typeof item.score === 'number' && Array.isArray(item.answersHistory) && Array.isArray(item.mcqs);
}


// --- ADVANCED Finished Screen Component ---
const QuizFinishedScreen: React.FC<{
    result: QuizResult;
    onRestart: (subset?: Mcq[]) => void;
    onFullRestart: () => void;
}> = ({ result, onRestart, onFullRestart }) => {
    const { score, answersHistory, mcqs } = result;
    const totalQuestions = answersHistory.length;
    const correctAnswers = score;
    const incorrectAnswers = answersHistory.filter(a => a.selected !== null && a.selected !== a.question.correctAnswer).length;
    const skippedAnswers = totalQuestions - correctAnswers - incorrectAnswers;
    const accuracy = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(1) : 0;

    const incorrectOrSkippedQuestions = useMemo(() =>
        answersHistory
            .filter(item => item.selected !== item.question.correctAnswer)
            .map(item => item.question),
        [answersHistory]
    );
    
    // FIX #1 (Root Cause): Explicitly type the accumulator for the reducer.
    // This tells TypeScript that the values in this object will be arrays (AnswerRecord[]),
    // which prevents the 'items' variable from being inferred as 'unknown'.
    const answersByTopic = useMemo(() => {
        return answersHistory.reduce((acc, item) => {
            const topic = item.question.topic || 'General';
            if (!acc[topic]) {
                acc[topic] = [];
            }
            acc[topic].push(item);
            return acc;
        }, {} as Record<string, AnswerRecord[]>);
    }, [answersHistory]);

    const getFinalMessage = () => {
        const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
        if (percentage === 100) return "Perfect Score! You're an absolute genius!";
        if (percentage >= 80) return "Excellent work! You've truly mastered this topic.";
        if (percentage >= 60) return "Good job! A little more practice and you'll be unstoppable.";
        if (percentage >= 40) return "Nice try! Review your answers and give it another shot.";
        return "Keep learning! Every attempt is a step towards mastery.";
    };

    const getOptionClass = (option: string, question: Mcq, selected: string | null) => {
        if (option === question.correctAnswer) return 'bg-green-500/30 border-green-500 ring-2 ring-green-500 text-white cursor-default scale-102';
        if (option === selected) return 'bg-red-500/30 border-red-500 text-white cursor-default';
        return 'bg-slate-800 opacity-60 cursor-default';
    };

    const getResultIcon = (option: string, question: Mcq, selected: string | null) => {
        if (option === question.correctAnswer) return <CheckCircleIcon className="h-6 w-6 text-green-400" />;
        if (option === selected) return <XCircleIcon className="h-6 w-6 text-red-400" />;
        return null;
    };


    return (
        <div className="space-y-6 p-4 bg-slate-800 rounded-md animate-fade-in">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-accent mb-2">Quiz Complete!</h2>
                <p className="text-slate-300 text-lg">{getFinalMessage()}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center p-4 bg-slate-900/50 rounded-lg">
                <div><p className="text-2xl font-bold text-sky-400">{accuracy}%</p><p className="text-sm text-slate-400">Accuracy</p></div>
                <div><p className="text-2xl font-bold text-green-400">{correctAnswers}</p><p className="text-sm text-slate-400">Correct</p></div>
                <div><p className="text-2xl font-bold text-red-400">{incorrectAnswers}</p><p className="text-sm text-slate-400">Incorrect</p></div>
                <div><p className="text-2xl font-bold text-yellow-400">{skippedAnswers}</p><p className="text-sm text-slate-400">Skipped</p></div>
            </div>
            
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={onFullRestart} className="w-full py-3 px-6 bg-accent text-white rounded-md transition-transform hover:scale-105">
                        Generate New Quiz
                    </button>
                    {incorrectOrSkippedQuestions.length > 0 && (
                        <button onClick={() => onRestart(incorrectOrSkippedQuestions)} className="w-full py-3 px-6 bg-sky-600 text-white rounded-md transition-transform hover:scale-105">
                            Review {incorrectOrSkippedQuestions.length} Incorrect
                        </button>
                    )}
                </div>
                <button onClick={() => onRestart(mcqs)} className="w-full py-3 px-6 bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-transform hover:scale-105">
                    Restart Same Quiz
                </button>
            </div>
            
            <h3 className="text-2xl font-bold text-slate-100 pt-4 border-t border-slate-700">Detailed Review</h3>
            {Object.entries(answersByTopic).map(([topic, items], topicIndex) => (
                <div key={topicIndex} className="mt-4">
                    <h4 className="text-xl font-bold text-sky-400 p-2 bg-slate-900/50 rounded-t-lg">{topic}</h4>
                    {/* FIX #2 (Safety Check): Ensure 'items' is an array before mapping. */}
                    {Array.isArray(items) && items.map((item, itemIndex) => (
                        <div key={itemIndex} className="p-4 bg-slate-700/80 space-y-3 border-b border-slate-600 last:border-b-0 last:rounded-b-lg">
                            <p className="font-bold text-lg"><span className="text-accent">{answersHistory.indexOf(item) + 1}.</span> {item.question.question}</p>
                            {/* FIX: Ensure item.options is an array before mapping */}
                            {Array.isArray(item.options) && item.options.map((opt, i) => (
                                <div key={i} className={`p-3 rounded-md flex justify-between items-center ${getOptionClass(opt, item.question, item.selected)}`}>
                                    <span>{opt}</span>
                                    {getResultIcon(opt, item.question, item.selected)}
                                </div>
                            ))}
                            <div className="mt-3 p-3 bg-slate-900/50 rounded-md border-l-4 border-sky-400">
                                <h4 className="font-bold text-sky-300">Explanation</h4>
                                <p className="text-slate-300 text-sm">{item.question.explanation}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};


// --- MODIFIED Quiz Component ---
const QuizComponent: React.FC<{
    mcqs: Mcq[];
    timePerQuestion?: number;
    onComplete: (score: number, answersHistory: AnswerRecord[]) => void;
}> = ({ mcqs, timePerQuestion = 30, onComplete }) => {
    const [shuffledMcqs, setShuffledMcqs] = useState<Mcq[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(timePerQuestion);
    const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
    const [answersHistory, setAnswersHistory] = useState<AnswerRecord[]>([]);
    const [lifelines, setLifelines] = useState({ fiftyFifty: 1, extraTime: 1, hint: 1 });
    const [isHintVisible, setIsHintVisible] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(0);

    useEffect(() => {
        if (mcqs.length > 0) {
            setShuffledMcqs([...mcqs].sort(() => Math.random() - 0.5));
            setCurrentQuestionIndex(0);
        }
    }, [mcqs]);
    
    const currentQuestion = shuffledMcqs[currentQuestionIndex];
    const isAnswered = selectedOption !== null;

    useEffect(() => {
        // FIX: Ensure options exist and is an array before shuffling
        if (currentQuestion && Array.isArray(currentQuestion.options)) {
            setShuffledOptions([...currentQuestion.options].sort(() => Math.random() - 0.5));
        } else if (currentQuestion) {
            setShuffledOptions([]); // Set to empty array if options are invalid
        }
    }, [currentQuestion]);

    const handleNextQuestion = useCallback((skipped = false) => {
        const finalSelectedOption = skipped ? null : selectedOption;
        const newHistory = [...answersHistory, { selected: finalSelectedOption, question: currentQuestion, options: shuffledOptions }];
        setAnswersHistory(newHistory);
        
        setTimeLeft(timePerQuestion);
        setSelectedOption(null);
        setIsHintVisible(false);

        if (currentQuestionIndex < shuffledMcqs.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            onComplete(score, newHistory);
        }
    }, [currentQuestionIndex, shuffledMcqs.length, timePerQuestion, selectedOption, currentQuestion, shuffledOptions, onComplete, score, answersHistory]);

    useEffect(() => {
        if (isAnswered) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleNextQuestion(true);
                    return timePerQuestion;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isAnswered, timePerQuestion, handleNextQuestion]);

    const handleOptionClick = (option: string) => {
        if (isAnswered) return;
        setSelectedOption(option);
        if (option === currentQuestion.correctAnswer) {
            setScore(prev => prev + 1);
            setCurrentStreak(prev => prev + 1);
        } else {
            setCurrentStreak(0);
        }
    };

    const handleFiftyFifty = useCallback(() => {
        if (lifelines.fiftyFifty <= 0 || isAnswered) return;
        const incorrectOptions = shuffledOptions.filter(opt => opt !== currentQuestion.correctAnswer);
        const removeCount = Math.min(2, incorrectOptions.length - 1);
        const toRemove = incorrectOptions.sort(() => Math.random() - 0.5).slice(0, removeCount);
        setShuffledOptions(shuffledOptions.filter(opt => !toRemove.includes(opt)));
        setLifelines(prev => ({ ...prev, fiftyFifty: 0 }));
    }, [isAnswered, lifelines.fiftyFifty, shuffledOptions, currentQuestion]);

    const handleExtraTime = useCallback(() => {
        if (lifelines.extraTime <= 0 || isAnswered) return;
        setTimeLeft(prev => prev + 15);
        setLifelines(prev => ({ ...prev, extraTime: 0 }));
    }, [isAnswered, lifelines.extraTime]);

    const handleHint = useCallback(() => {
        if (lifelines.hint <= 0 || isAnswered) return;
        setIsHintVisible(true);
        setLifelines(prev => ({ ...prev, hint: 0 }));
    }, [isAnswered, lifelines.hint]);
    
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (isAnswered) {
                if (e.key === 'Enter') handleNextQuestion();
                return;
            }

            const key = e.key.toLowerCase();
            if (key === 'f') { e.preventDefault(); handleFiftyFifty(); }
            if (key === 't') { e.preventDefault(); handleExtraTime(); }
            if (key === 'h') { e.preventDefault(); handleHint(); }
            
            const keyNum = parseInt(e.key);
            if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= shuffledOptions.length) {
                handleOptionClick(shuffledOptions[keyNum - 1]);
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [shuffledOptions, isAnswered, handleNextQuestion, handleFiftyFifty, handleExtraTime, handleHint]);

    const getOptionClass = (option: string) => {
        if (!isAnswered) return 'bg-slate-800 hover:bg-slate-700 hover:scale-102 cursor-pointer';
        if (option === currentQuestion.correctAnswer) return 'bg-green-500/30 border-green-500 ring-2 ring-green-500 text-white cursor-default scale-102';
        if (option === selectedOption) return 'bg-red-500/30 border-red-500 text-white cursor-default';
        return 'bg-slate-800 opacity-50 cursor-default';
    };

    const getResultIcon = (option: string) => {
        if (!isAnswered) return null;
        if (option === currentQuestion.correctAnswer) return <CheckCircleIcon className="h-6 w-6 text-green-400 animate-pulse" />;
        if (option === selectedOption) return <XCircleIcon className="h-6 w-6 text-red-400" />;
        return null;
    };

    if (!currentQuestion) {
        return <div className="text-center p-8">Preparing your quiz...</div>;
    }

    const progressPercentage = ((currentQuestionIndex) / shuffledMcqs.length) * 100;

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="w-full bg-slate-700 rounded-full h-3.5 relative">
                <div className={`h-3.5 rounded-full transition-all duration-500 bg-sky-500`} style={{ width: `${progressPercentage}%` }}></div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference">
                    {`Question ${currentQuestionIndex + 1} of ${shuffledMcqs.length}`}
                </div>
            </div>
            
            <div className="flex justify-between items-center text-xs text-slate-400 -mt-2 px-2">
                <span>Topic: <span className="font-semibold text-slate-300">{currentQuestion.topic || 'General'}</span></span>
                <span>Difficulty: <span className="font-semibold text-slate-300">{currentQuestion.difficulty || 'Medium'}</span></span>
            </div>

            <div className="flex justify-between items-center text-sm text-slate-400 px-1">
                <div className="flex items-center gap-2 font-semibold">
                    Score: <span className="text-white text-base">{score}</span>
                </div>
                {currentStreak > 1 && (
                    <div className="flex items-center gap-1 text-yellow-400 font-bold animate-fade-in">
                        <FireIcon className="h-5 w-5" /> {currentStreak} Streak!
                    </div>
                )}
                <div className={`flex items-center gap-2 font-semibold transition-colors ${timeLeft <= 10 ? 'text-red-400' : 'text-slate-400'}`}>
                    <ClockIcon className="h-5 w-5" />
                    <span className="text-white text-base">{timeLeft}s</span>
                </div>
            </div>

            <div className="p-4 bg-slate-800 rounded-lg space-y-3 shadow-lg">
                <p className="font-bold mb-4 text-lg md:text-xl text-slate-100">{currentQuestion.question}</p>
                {/* FIX: Ensure shuffledOptions is an array before mapping */}
                {Array.isArray(shuffledOptions) && shuffledOptions.map((option, i) => (
                    <div key={i} onClick={() => handleOptionClick(option)}
                        className={`p-3 rounded-md transition-all duration-200 border border-transparent flex items-center justify-between transform ${getOptionClass(option)}`}
                        role="button" aria-pressed={selectedOption === option} tabIndex={isAnswered ? -1 : 0}>
                        <div className="flex items-center">
                            <span className="mr-3 text-accent font-bold text-sm hidden sm:inline">{i + 1}.</span>
                            <span>{option}</span>
                        </div>
                        {getResultIcon(option)}
                    </div>
                ))}

                {!isAnswered && (
                     <div className="flex flex-wrap justify-center sm:justify-end gap-2 pt-3">
                        <button onClick={handleFiftyFifty} disabled={lifelines.fiftyFifty <= 0} title="50-50 (F)" className="py-1 px-3 text-sm rounded-md flex items-center gap-1 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed">50-50</button>
                        <button onClick={handleExtraTime} disabled={lifelines.extraTime <= 0} title="Extra Time (T)" className="py-1 px-3 text-sm rounded-md flex items-center gap-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"><ClockIcon className="h-4 w-4" />+15s</button>
                        <button onClick={handleHint} disabled={lifelines.hint <= 0} title="Hint (H)" className="py-1 px-3 text-sm rounded-md flex items-center gap-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"><LightBulbIcon className="h-4 w-4" />Hint</button>
                     </div>
                )}
                
                {isHintVisible && !isAnswered && (
                    <div className="mt-4 p-3 bg-slate-900/50 rounded-md border-l-4 border-purple-400 animate-fade-in">
                        <h4 className="font-bold text-purple-300 mb-1">Hint</h4>
                        <p className="text-slate-300 text-sm">{currentQuestion.explanation.split('.')[0]}.</p>
                    </div>
                )}
                
                {isAnswered && (
                    <div className="mt-4 p-4 bg-slate-900/50 rounded-md border-l-4 border-sky-400 animate-fade-in">
                        <h4 className="font-bold text-sky-300 mb-2">Explanation</h4>
                        <p className="text-slate-300 text-sm leading-relaxed">{currentQuestion.explanation}</p>
                    </div>
                )}
            </div>

            {isAnswered && (
                <button onClick={() => handleNextQuestion()} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-md font-medium text-white bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent btn-animated">
                    {currentQuestionIndex < shuffledMcqs.length - 1 ? 'Next Question' : 'Finish & See Results'}
                </button>
            )}
        </div>
    );
};

// --- FIXED Quiz Session Manager ---
const QuizSessionManager: React.FC<{
    sessionData: Mcq[] | QuizResult;
    onFullRestart: () => void;
    onSaveResult: (result: QuizResult) => void;
}> = ({ sessionData, onFullRestart, onSaveResult }) => {
    const [quizState, setQuizState] = useState<'playing' | 'finished'>(
        isQuizResult(sessionData) ? 'finished' : 'playing'
    );
    const [currentResult, setCurrentResult] = useState<QuizResult | null>(
        isQuizResult(sessionData) ? sessionData : null
    );
    const [mcqsForQuiz, setMcqsForQuiz] = useState<Mcq[]>(
        isQuizResult(sessionData) ? sessionData.mcqs : sessionData
    );

    useEffect(() => {
        if (isQuizResult(sessionData)) {
            setQuizState('finished');
            setCurrentResult(sessionData);
            setMcqsForQuiz(sessionData.mcqs);
        } else {
            setQuizState('playing');
            setCurrentResult(null);
            setMcqsForQuiz(sessionData);
        }
    }, [sessionData]);

    const handleQuizComplete = (score: number, answersHistory: AnswerRecord[]) => {
        const result: QuizResult = {
            mcqs: mcqsForQuiz,
            score,
            answersHistory
        };
        setCurrentResult(result);
        setQuizState('finished');
        onSaveResult(result);
    };

    const handleRestartQuiz = (subset?: Mcq[]) => {
        const originalMcqs = isQuizResult(sessionData) ? sessionData.mcqs : sessionData;
        setMcqsForQuiz(subset || originalMcqs);
        setCurrentResult(null);
        setQuizState('playing');
    };

    if (quizState === 'playing') {
        return <QuizComponent mcqs={mcqsForQuiz} onComplete={handleQuizComplete} />;
    }

    if (quizState === 'finished' && currentResult) {
        return <QuizFinishedScreen result={currentResult} onRestart={handleRestartQuiz} onFullRestart={onFullRestart} />;
    }

    return <p className="text-red-400">An unexpected error occurred in the quiz session.</p>;
};


// --- RENDER and GENERATOR Components ---
export const renderMcqOutput = (
    output: Mcq[] | QuizResult | string,
    onFullRestart: () => void,
    onSaveResult: (result: QuizResult) => void
) => {
    let sessionData: any;
    
    if (typeof output === 'string') {
        try { 
            const parsed = JSON.parse(output);
            sessionData = parsed;
        } catch (e) { 
            return <p className="text-red-400">Failed to parse history data.</p>; 
        }
    } else {
        sessionData = output;
    }

    // FIX: Strengthened validation to ensure 'options' is an array for every question.
    const isValidMcqArray = Array.isArray(sessionData) && sessionData.length > 0 && sessionData.every(item => item && item.question && Array.isArray(item.options));

    if (!isQuizResult(sessionData) && !isValidMcqArray) {
        return <p className="text-red-400">Could not generate a valid quiz. Please try a different prompt.</p>;
    }
    
    return (
        <QuizSessionManager
            sessionData={sessionData}
            onFullRestart={onFullRestart}
            onSaveResult={onSaveResult}
        />
    );
};

const McqGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'mcq-generator')!;
    const [componentKey, setComponentKey] = useState(1);
    const [currentPromptSuggestion, setCurrentPromptSuggestion] = useState(toolInfo.promptSuggestion);

    const optionsConfig: ToolOptionConfig[] = [
        { name: 'numQuestions', label: 'Number of Questions', type: 'number', defaultValue: 5, min: 1, max: 20 },
        { name: 'difficulty', label: 'Difficulty', type: 'select', defaultValue: 'Medium', options: [
            { value: 'Easy', label: 'Easy' }, { value: 'Medium', label: 'Medium' }, { value: 'Hard', 'label': 'Hard' }, { value: 'Expert', label: 'Expert' },
        ]},
        { name: 'focus', label: 'Focus', type: 'select', defaultValue: 'Core Concepts', options: [
            { value: 'Key Terminology', label: 'Key Terminology' }, { value: 'Core Concepts', label: 'Core Concepts' }, { value: 'Practical Application', label: 'Practical Application' }, { value: 'Broad Understanding', label: 'Broad Understanding' },
        ]},
        { name: 'timePerQuestion', label: 'Time per Question (sec)', type: 'number', defaultValue: 30, min: 10, max: 120 },
        languageOptions
    ];
    
    const schema = {
        type: GenAiType.ARRAY,
        items: {
            type: GenAiType.OBJECT,
            properties: {
                question: { type: GenAiType.STRING },
                options: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "Array of 4 potential answers." },
                correctAnswer: { type: GenAiType.STRING, description: "Correct answer, must be one of the strings in the options array." },
                explanation: { type: GenAiType.STRING, description: "A clear and detailed explanation for why the correct answer is right." },
                topic: { type: GenAiType.STRING, description: "A brief topic/category for this specific question (e.g., 'React Hooks', 'JavaScript Promises')." },
                difficulty: { type: GenAiType.STRING, description: "The difficulty of the question (e.g., 'Easy', 'Medium', 'Hard')." }
            },
            required: ['question', 'options', 'correctAnswer', 'explanation', 'topic', 'difficulty'],
        },
    };

    const handleGenerate = async ({ prompt: text, options }: { prompt: string; options: any }) => {
        const { numQuestions, difficulty, language, focus } = options;
        const promptText = `Generate ${numQuestions} multiple-choice questions about the following text. The overall quiz difficulty is ${difficulty}, so tailor the questions accordingly. Focus on '${focus}'. Each question MUST have exactly 4 options, a 'correctAnswer' that is an exact match to one of the options, a detailed 'explanation', a specific 'topic', and its 'difficulty' level. All text, including questions, options, and explanations, must be in ${language}. Text: "${text}"`;
        return generateJson(promptText, schema);
    };

    const handleFullRestart = () => {
        setCurrentPromptSuggestion('');
        setComponentKey(prevKey => prevKey + 1);
    };

    return (
        <ToolContainer
            key={componentKey}
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={currentPromptSuggestion}
            optionsConfig={optionsConfig}
            onGenerate={handleGenerate}
            renderOutput={(output, onUpdateOutput) => 
                renderMcqOutput(output, handleFullRestart, (result) => {
                    if (onUpdateOutput) {
                        onUpdateOutput(result);
                    }
                })
            }
        />
    );
};

export default McqGenerator;
