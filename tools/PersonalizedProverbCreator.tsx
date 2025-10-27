import React from 'react';
import ToolContainer from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { TrophyIcon } from './Icons';

interface ProverbOutput {
    lesson: string;
    proverb: string;
}

export const renderPersonalizedProverbCreatorOutput = (output: ProverbOutput | string) => {
    let data: ProverbOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.proverb) {
        return <p className="text-red-400">Could not create a proverb. Please describe your lesson more clearly.</p>;
    }
    return (
        <div className="space-y-6">
            <div className="text-center">
                <TrophyIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Your Personal Proverb</h2>
            </div>
            <div className="bg-gradient-to-r from-slate-800 to-secondary p-8 rounded-lg shadow-xl text-center">
                <p className="text-slate-400 italic mb-4">Based on your lesson: "{data.lesson}"</p>
                <p className="text-3xl font-serif font-bold text-light">"{data.proverb}"</p>
            </div>
        </div>
    );
};

const PersonalizedProverbCreator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'personalized-proverb-creator')!;

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            lesson: { type: GenAiType.STRING, description: "The user's original lesson or experience." },
            proverb: { type: GenAiType.STRING, description: "A new, wise-sounding proverb that encapsulates the lesson." },
        },
        required: ["lesson", "proverb"]
    };

    const handleGenerate = async ({ prompt }: { prompt: string; options: Record<string, any> }) => {
        const fullPrompt = `A user has shared a personal experience or a lesson they've learned. Your task is to distill this into a unique, timeless-sounding proverb. The proverb should be concise, wise, and memorable.

        User's Lesson: "${prompt}"`;
        return generateJson(fullPrompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            onGenerate={handleGenerate}
            renderOutput={renderPersonalizedProverbCreatorOutput}
        />
    );
};

export default PersonalizedProverbCreator;
