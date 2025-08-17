import React from 'react';
import ToolContainer from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { EnvelopeIcon } from './Icons';

interface HistoricalPenPalOutput {
    historicalFigure: string;
    recipientConcept: string;
    letter: string;
}

export const renderHistoricalPenPalOutput = (output: HistoricalPenPalOutput | string) => {
    let data: HistoricalPenPalOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.letter) {
        return <p className="text-red-400">Could not generate a letter. Please try a different scenario.</p>;
    }
    return (
        <div className="bg-amber-50 p-6 sm:p-8 rounded-md border border-amber-800/20 shadow-xl font-serif text-slate-800">
            <div className="text-center border-b-2 border-dashed border-amber-800/30 pb-4 mb-6">
                <EnvelopeIcon className="h-8 w-8 mx-auto text-amber-900 mb-2" />
                <h2 className="text-2xl font-bold text-amber-900">A Letter from {data.historicalFigure}</h2>
                <p className="text-sm text-amber-800/80">Regarding "{data.recipientConcept}"</p>
            </div>
            <div className="prose prose-p:text-slate-700 prose-p:leading-relaxed max-w-none">
                {data.letter.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                ))}
            </div>
        </div>
    );
};

const HistoricalPenPal: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'historical-pen-pal')!;

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            historicalFigure: { type: GenAiType.STRING },
            recipientConcept: { type: GenAiType.STRING, description: "The modern concept the letter is reacting to." },
            letter: { type: GenAiType.STRING, description: "The full text of the letter from the historical figure's perspective." }
        },
        required: ["historicalFigure", "recipientConcept", "letter"]
    };

    const handleGenerate = async ({ prompt }: { prompt: string; options: any }) => {
        const fullPrompt = `You are a historical figure writing a letter to a modern student. The student has told you about a modern concept. In the letter, describe your daily life and react to this concept from your historical perspective. The user will provide both the historical figure and the modern concept in the prompt. Identify both from the following prompt, then write the letter.

        User prompt: "${prompt}"`;
        return generateJson(fullPrompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            onGenerate={handleGenerate}
            renderOutput={renderHistoricalPenPalOutput}
        />
    );
};

export default HistoricalPenPal;
