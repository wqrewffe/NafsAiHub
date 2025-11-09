import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { CheckBadgeIcon, XCircleIcon, LightBulbIcon } from './Icons';

interface ProofStep {
    step: string;
    isCorrect: boolean;
    feedback: string;
}

interface ProofOutput {
    theorem: string;
    proofAnalysis: ProofStep[];
    overallFeedback: string;
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

export const renderMathProofAssistantOutput = (output: ProofOutput | string) => {
    let data: ProofOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.proofAnalysis)) {
        return <p className="text-red-400">Could not analyze the proof. Please format your proof with clear steps.</p>;
    }
    return (
        <div className="space-y-6">
            <div className="text-center">
                <CheckBadgeIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Proof Analysis: <span className="text-accent">{data.theorem}</span></h2>
            </div>
            <div className="space-y-4">
                {data.proofAnalysis.map((item, index) => (
                    <div key={index} className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                            {item.isCorrect 
                                ? <CheckBadgeIcon className="h-6 w-6 text-green-500" />
                                : <XCircleIcon className="h-6 w-6 text-red-500" />
                            }
                        </div>
                        <div className="flex-1 bg-secondary p-3 rounded-lg">
                            <p className="font-mono text-slate-300"><strong>Step {index+1}:</strong> {item.step}</p>
                            <p className={`mt-2 text-sm ${item.isCorrect ? 'text-slate-400' : 'text-red-400'}`}>{item.feedback}</p>
                        </div>
                    </div>
                ))}
            </div>
             <div className="mt-6">
                 <h4 className="flex items-center text-lg font-bold text-amber-400 mb-2">
                    <LightBulbIcon className="h-6 w-6 mr-2" />
                    Overall Feedback
                </h4>
                <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-amber-400">
                    <p className="text-slate-300 italic">{data.overallFeedback}</p>
                </div>
            </div>
        </div>
    );
};

const MathProofAssistant: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'math-proof-assistant')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'strictness',
            label: 'Strictness Level',
            type: 'select',
            defaultValue: 'Standard',
            options: [
                { value: 'Lenient', label: 'Lenient (Focus on core idea)' },
                { value: 'Standard', label: 'Standard (Balanced)' },
                { value: 'Strict', label: 'Strict (Rigorous formal logic)' },
            ]
        },
        {
            name: 'proofType',
            label: 'Proof Type',
            type: 'select',
            defaultValue: 'Direct Proof',
            options: [
                { value: 'Direct Proof', label: 'Direct Proof' },
                { value: 'Proof by Contradiction', label: 'Proof by Contradiction' },
                { value: 'Proof by Induction', label: 'Proof by Induction' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            theorem: { type: GenAiType.STRING, description: "The theorem the user is trying to prove." },
            proofAnalysis: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        step: { type: GenAiType.STRING, description: "The specific step from the user's proof." },
                        isCorrect: { type: GenAiType.BOOLEAN, description: "True if the logical step is correct, false otherwise." },
                        feedback: { type: GenAiType.STRING, description: "Explanation of why the step is correct or incorrect, with suggestions." }
                    },
                    required: ["step", "isCorrect", "feedback"]
                }
            },
            overallFeedback: { type: GenAiType.STRING, description: "A summary of the proof's validity and general advice." }
        },
        required: ["theorem", "proofAnalysis", "overallFeedback"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { strictness, language, proofType } = options;
        const fullPrompt = `Act as a math professor with a ${strictness} strictness level for feedback. A student has submitted a mathematical proof of type '${proofType}'. Your task is to analyze it step-by-step. Identify the theorem being proved. For each step, restate it, determine if its logic is correct, and provide feedback. Finally, give overall feedback on the proof. The entire response must be in ${language}.

        Student's Proof: "${prompt}"`;
        return generateJson(fullPrompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            optionsConfig={optionsConfig}
            onGenerate={handleGenerate}
            renderOutput={renderMathProofAssistantOutput}
        />
    );
};

export default MathProofAssistant;