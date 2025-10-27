import React from 'react';
import ToolContainer from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { MagnifyingGlassCircleIcon, CheckCircleIcon, XCircleIcon, QuestionMarkCircleIcon } from './Icons';

interface MythDebunkerOutput {
    myth: string;
    verdict: 'Busted' | 'Plausible' | 'Confirmed';
    explanation: string;
    sources: string[];
}

const VerdictDisplay: React.FC<{ verdict: string }> = ({ verdict }) => {
    switch (verdict) {
        case 'Busted':
            return (
                <div className="flex items-center gap-2 text-red-400">
                    <XCircleIcon className="h-8 w-8" />
                    <span className="text-2xl font-bold uppercase tracking-wider">{verdict}</span>
                </div>
            );
        case 'Confirmed':
            return (
                <div className="flex items-center gap-2 text-green-400">
                    <CheckCircleIcon className="h-8 w-8" />
                    <span className="text-2xl font-bold uppercase tracking-wider">{verdict}</span>
                </div>
            );
        case 'Plausible':
            return (
                <div className="flex items-center gap-2 text-yellow-400">
                    <QuestionMarkCircleIcon className="h-8 w-8" />
                    <span className="text-2xl font-bold uppercase tracking-wider">{verdict}</span>
                </div>
            );
        default:
            return null;
    }
};

export const renderMythDebunkerOutput = (output: MythDebunkerOutput | string) => {
    let data: MythDebunkerOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.myth || !data.explanation) {
        return <p className="text-red-400">Could not analyze the myth. Please try again.</p>;
    }
    return (
        <div className="space-y-6">
            <div className="text-center p-4 bg-primary rounded-lg">
                <p className="text-slate-400">The Myth:</p>
                <h2 className="text-xl font-semibold text-light italic">"{data.myth}"</h2>
            </div>
            <div className="flex justify-center my-4">
                <VerdictDisplay verdict={data.verdict} />
            </div>
            <div className="bg-secondary p-4 rounded-lg">
                <h3 className="font-bold text-lg text-accent mb-2">Explanation</h3>
                <p className="text-slate-300 whitespace-pre-wrap">{data.explanation}</p>
            </div>
            {data.sources && data.sources.length > 0 && (
                <div className="bg-secondary p-4 rounded-lg">
                    <h3 className="font-bold text-lg text-accent mb-2">Sources & Further Reading</h3>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm">
                       {data.sources.map((source, i) => <li key={i}>{source}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
};

const MythDebunker: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'myth-debunker')!;

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            myth: { type: GenAiType.STRING },
            verdict: { type: GenAiType.STRING, enum: ['Busted', 'Plausible', 'Confirmed'] },
            explanation: { type: GenAiType.STRING, description: "A detailed explanation of the facts." },
            sources: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "A list of 1-2 reliable sources to support the explanation." }
        },
        required: ["myth", "verdict", "explanation", "sources"]
    };

    const handleGenerate = async ({ prompt }: { prompt: string; options: any }) => {
        const fullPrompt = `Act as a fact-checker. Analyze the following common myth or misconception. Provide a verdict (Busted, Plausible, or Confirmed), a detailed explanation of the reality, and 1-2 reliable sources to back it up.

        Myth: "${prompt}"`;
        return generateJson(fullPrompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            onGenerate={handleGenerate}
            renderOutput={renderMythDebunkerOutput}
        />
    );
};

export default MythDebunker;
