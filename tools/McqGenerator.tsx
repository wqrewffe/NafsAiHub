
import React, { useState } from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { CheckCircleIcon, XCircleIcon } from './Icons';

interface Mcq {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
}

const languageOptions: ToolOptionConfig = {
    name: 'language',
    label: 'Output Language',
    type: 'select',
    defaultValue: 'English',
    options: [
        { value: 'English', label: 'English' },
        { value: 'Spanish', label: 'Spanish' },
        { value: 'French', label: 'French' },
        { value: 'German', label: 'German' },
        { value: 'Japanese', label: 'Japanese' },
        { value: 'Mandarin Chinese', label: 'Mandarin Chinese' },
        { value: 'Hindi', label: 'Hindi' },
        { value: 'Arabic', label: 'Arabic' },
        { value: 'Portuguese', label: 'Portuguese' },
        { value: 'Bengali', label: 'Bengali (Bangla)' },
        { value: 'Russian', label: 'Russian' },
    ]
};

const QuizComponent: React.FC<{ mcqs: Mcq[] }> = ({ mcqs }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [quizFinished, setQuizFinished] = useState(false);

    const currentQuestion = mcqs[currentQuestionIndex];
    const isAnswered = selectedOption !== null;

    const handleOptionClick = (option: string) => {
        if (isAnswered) return;

        setSelectedOption(option);
        if (option === currentQuestion.correctAnswer) {
            setScore(prevScore => prevScore + 1);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < mcqs.length - 1) {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
            setSelectedOption(null);
        } else {
            setQuizFinished(true);
        }
    };
    
    const handleRestart = () => {
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setScore(0);
        setQuizFinished(false);
    };

    const getOptionClass = (option: string) => {
        if (!isAnswered) {
            return 'bg-slate-800 hover:bg-slate-700 hover:scale-102 cursor-pointer';
        }
        if (option === currentQuestion.correctAnswer) {
            return 'bg-green-500/30 border-green-500 ring-2 ring-green-500 text-white cursor-default scale-102';
        }
        if (option === selectedOption) {
            return 'bg-red-500/30 border-red-500 text-white cursor-default';
        }
        return 'bg-slate-800 opacity-50 cursor-default';
    };

    const getResultIcon = (option: string) => {
        if (!isAnswered) return null;
        if (option === currentQuestion.correctAnswer) {
            return <CheckCircleIcon className="h-6 w-6 text-green-400 animate-pulse" />;
        }
        if (option === selectedOption) {
            return <XCircleIcon className="h-6 w-6 text-red-400" />;
        }
        return null;
    }

    const getFinalMessage = () => {
        const percentage = (score / mcqs.length) * 100;
        if (percentage === 100) return "Perfect Score! You're a genius!";
        if (percentage >= 80) return "Excellent work! You've mastered this topic.";
        if (percentage >= 60) return "Good job! A little more practice and you'll be an expert.";
        return "Keep trying! Every attempt is a step forward.";
    }

    if (quizFinished) {
        return (
            <div className="text-center p-6 bg-slate-800 rounded-lg">
                <h2 className="text-3xl font-bold mb-2 text-light">Quiz Complete!</h2>
                <p className="text-lg text-slate-300 mb-4">{getFinalMessage()}</p>
                <p className="text-5xl font-bold text-accent mb-6">
                    {score} <span className="text-3xl text-slate-400">/ {mcqs.length}</span>
                </p>
                <button
                    onClick={handleRestart}
                    className="w-full sm:w-auto flex-shrink-0 py-2 px-6 border border-transparent rounded-md shadow-sm text-md font-medium text-white bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent btn-animated"
                >
                    Take Quiz Again
                </button>
            </div>
        );
    }

    const progressPercentage = ((currentQuestionIndex + 1) / mcqs.length) * 100;

    return (
        <div className="space-y-6">
            <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className="bg-accent h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <div className="flex justify-between items-center text-sm text-slate-400">
                <span>Question {currentQuestionIndex + 1} of {mcqs.length}</span>
                <span className="font-semibold">Score: {score}</span>
            </div>
            <div className="p-4 bg-slate-800 rounded-md">
                <p className="font-bold mb-4 text-lg">{currentQuestion.question}</p>
                <div className="space-y-3">
                    {currentQuestion.options.map((option, i) => (
                        <div
                            key={i}
                            onClick={() => handleOptionClick(option)}
                            className={`p-3 rounded-md transition-all duration-200 border border-transparent flex items-center justify-between transform ${getOptionClass(option)}`}
                            role="button"
                            aria-pressed={selectedOption === option}
                            tabIndex={isAnswered ? -1 : 0}
                        >
                            <span>{option}</span>
                            {getResultIcon(option)}
                        </div>
                    ))}
                </div>
                 {isAnswered && (
                    <div className="mt-4 p-4 bg-slate-900/50 rounded-md border-l-4 border-sky-400 animate-fade-in">
                        <h4 className="font-bold text-sky-300 mb-2">Explanation</h4>
                        <p className="text-slate-300 text-sm leading-relaxed">{currentQuestion.explanation}</p>
                    </div>
                )}
            </div>
            {isAnswered && (
                <button
                    onClick={handleNextQuestion}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-md font-medium text-white bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent btn-animated"
                >
                    {currentQuestionIndex < mcqs.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </button>
            )}
        </div>
    );
};

export const renderMcqOutput = (output: Mcq[] | string) => {
    let mcqs: Mcq[];
    if (typeof output === 'string') {
        try {
            mcqs = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        mcqs = output;
    }

    if (!Array.isArray(mcqs) || mcqs.length === 0) {
        return <p className="text-red-400">Could not generate a valid quiz. Please try a different prompt.</p>;
    }
    const isValid = mcqs.every(item => item.question && Array.isArray(item.options) && item.correctAnswer && item.options.includes(item.correctAnswer));
    if (!isValid) {
        return <p className="text-red-400">The generated quiz data is malformed. Please try again.</p>;
    }
    return <QuizComponent mcqs={mcqs} />;
};


const McqGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'mcq-generator')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'numQuestions',
            label: 'Number of Questions',
            type: 'number',
            defaultValue: 5,
            min: 1,
            max: 10,
        },
        {
            name: 'difficulty',
            label: 'Difficulty',
            type: 'select',
            defaultValue: 'Medium',
            options: [
                { value: 'Easy', label: 'Easy' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Hard', label: 'Hard' },
            ]
        },
        {
            name: 'focus',
            label: 'Focus',
            type: 'select',
            defaultValue: 'Core Concepts',
            options: [
                { value: 'Key Terminology', label: 'Key Terminology' },
                { value: 'Core Concepts', label: 'Core Concepts' },
                { value: 'Broad Understanding', label: 'Broad Understanding' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.ARRAY,
        items: {
            type: GenAiType.OBJECT,
            properties: {
                question: { type: GenAiType.STRING },
                options: {
                    type: GenAiType.ARRAY,
                    items: { type: GenAiType.STRING },
                    description: "An array of exactly 4 potential answers."
                },
                correctAnswer: { 
                    type: GenAiType.STRING,
                    description: "The correct answer, which must be one of the strings from the 'options' array."
                },
                explanation: {
                    type: GenAiType.STRING,
                    description: "A detailed explanation of why the correct answer is correct and why the other options are incorrect."
                },
            },
            required: ['question', 'options', 'correctAnswer', 'explanation'],
        },
    };

    const handleGenerate = async ({ prompt: text, options }: { prompt: string; options: any }) => {
        const { numQuestions, difficulty, language, focus } = options;
        const prompt = `Based on the following text, generate ${numQuestions} multiple-choice questions of ${difficulty} difficulty. The questions should focus on testing '${focus}'. For each question, provide 4 options, indicate the correct answer, and provide a detailed explanation for why the correct answer is correct and why the other options are incorrect. The correct answer MUST be one of the provided options. The entire response, including the questions, answers, and explanation, should be in ${language}. Text: "${text}"`;
        return generateJson(prompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            optionsConfig={optionsConfig}
            onGenerate={handleGenerate}
            renderOutput={renderMcqOutput}
        />
    );
};

export default McqGenerator;
