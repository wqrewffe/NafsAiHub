import React from 'react';
import ToolContainer from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { ArrowPathIcon } from './Icons';

interface SlangTranslatorOutput {
    slangTerm: string;
    formalTranslation: string;
    explanation: string;
    exampleUsage: string;
}

export const renderSlangTranslatorOutput = (output: SlangTranslatorOutput | string) => {
    let data: SlangTranslatorOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.slangTerm || !data.formalTranslation) {
        return <p className="text-red-400">Could not translate this term. Please ensure it's a common slang term.</p>;
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-light">Slang Translator</h2>
            </div>
            <div className="flex items-center justify-center gap-4">
                <div className="flex-1 text-center bg-secondary p-6 rounded-lg">
                    <p className="text-sm uppercase text-slate-400">Slang</p>
                    <p className="text-3xl font-bold text-accent">{data.slangTerm}</p>
                </div>
                <ArrowPathIcon className="h-8 w-8 text-slate-500 flex-shrink-0" />
                <div className="flex-1 text-center bg-secondary p-6 rounded-lg">
                    <p className="text-sm uppercase text-slate-400">Formal English</p>
                    <p className="text-3xl font-bold text-accent">{data.formalTranslation}</p>
                </div>
            </div>
            <div className="bg-primary p-4 rounded-md space-y-3">
                <div>
                    <h4 className="font-semibold text-light">Explanation & Origin</h4>
                    <p className="text-slate-400 text-sm">{data.explanation}</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-light">Example Usage</h4>
                    <p className="text-slate-400 text-sm italic">"{data.exampleUsage}"</p>
                </div>
            </div>
        </div>
    );
};

const SlangTranslator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'slang-translator')!;

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            slangTerm: { type: GenAiType.STRING },
            formalTranslation: { type: GenAiType.STRING },
            explanation: { type: GenAiType.STRING, description: "A brief explanation of the term's meaning, origin, and cultural context." },
            exampleUsage: { type: GenAiType.STRING, description: "A sentence showing the correct usage of the slang term." }
        },
        required: ["slangTerm", "formalTranslation", "explanation", "exampleUsage"]
    };

    const handleGenerate = async ({ prompt }: { prompt: string; options: any }) => {
        const fullPrompt = `Analyze the modern slang term/phrase: "${prompt}". Provide its formal English translation, a brief explanation of its meaning and origin, and an example sentence showing its correct usage.`;
        return generateJson(fullPrompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            onGenerate={handleGenerate}
            renderOutput={renderSlangTranslatorOutput}
        />
    );
};

export default SlangTranslator;
