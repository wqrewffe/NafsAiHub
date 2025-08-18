
import React from 'react';
import ToolContainer from './common/ToolContainer';
import type { ToolOptionConfig } from '../types';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { languageOptions } from './common/options';

interface MathSolution {
    problem: string;
    steps: string[];
    finalAnswer: string;
}

export const renderMathProblemSolverOutput = (output: MathSolution | string) => {
    let data: MathSolution;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.steps) || !data.finalAnswer) {
         return <p className="text-red-400">The generated solution is malformed. Please try again.</p>;
    }
    return (
        <div className="space-y-6 font-sans">
            <div>
                 <h3 className="text-md font-semibold text-slate-400 mb-1">Problem:</h3>
                 <p className="p-3 bg-slate-800 rounded-md text-light font-medium">{data.problem}</p>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-light mb-3">Step-by-step Solution:</h3>
                <div className="space-y-3 border-l-2 border-accent pl-6">
                    {data.steps.map((step, index) => (
                        <div key={index} className="relative p-4 bg-primary/50 rounded-r-lg border-l-4 border-accent/50">
                             <div className="absolute -left-10 top-3 flex items-center justify-center h-8 w-8 rounded-full bg-accent text-primary font-bold text-md">{index + 1}</div>
                            <p className="text-slate-300">{step}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="pt-4">
                 <h3 className="text-lg font-semibold text-light mb-2 text-center">Final Answer</h3>
                 <div className="p-4 bg-gradient-to-r from-sky-500 to-accent rounded-lg shadow-lg text-center">
                    <p className="text-white font-bold text-2xl tracking-wider">{data.finalAnswer}</p>
                </div>
            </div>
        </div>
    );
};

const MathProblemSolver: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'math-problem-solver')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'explanationStyle',
            label: 'Explanation Style',
            type: 'select',
            defaultValue: 'Detailed Explanation',
            options: [
                { value: 'Just the steps', label: 'Just the Steps' },
                { value: 'Detailed Explanation', label: 'Detailed Explanation' },
            ]
        },
        {
            name: 'mathLevel',
            label: 'Math Level',
            type: 'select',
            defaultValue: 'High School',
            options: [
                { value: 'High School', label: 'High School' },
                { value: 'College', label: 'College' },
                { value: 'Advanced', label: 'Advanced' },
            ]
        },
        languageOptions,
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            problem: {
                type: GenAiType.STRING,
                description: "The original math problem."
            },
            steps: {
                type: GenAiType.ARRAY,
                items: { type: GenAiType.STRING },
                description: "An array of strings, where each string is a clear, concise step in solving the problem."
            },
            finalAnswer: {
                type: GenAiType.STRING,
                description: "The final, conclusive answer to the problem, simplified."
            }
        },
        required: ['problem', 'steps', 'finalAnswer']
    };

    const handleGenerate = async ({ prompt: problem, options, image }: { prompt: string; options: any; image?: { mimeType: string; data: string } }) => {
        const { explanationStyle, language, mathLevel } = options;
        const imageInstruction = image ? "The math problem to solve is in the provided image. The text prompt contains any additional context or instructions." : "The math problem to solve is in the text prompt."
        const prompt = `Provide a step-by-step solution for the following math problem. ${imageInstruction} Re-state the original problem, then list the steps, and finally provide the final answer clearly. The explanation for each step should be in a "${explanationStyle}" style, appropriate for a '${mathLevel}' level of understanding. The entire response must be in ${language}.\n\nProblem: ${problem}`;
        return generateJson(prompt, schema, image);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            optionsConfig={optionsConfig}
            onGenerate={handleGenerate}
            renderOutput={renderMathProblemSolverOutput}
        />
    );
};

export default MathProblemSolver;