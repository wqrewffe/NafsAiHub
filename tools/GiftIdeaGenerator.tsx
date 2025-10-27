
import React from 'react';
import ToolContainer from './common/ToolContainer';
import type { ToolOptionConfig } from '../types';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { GiftIcon } from './Icons';
import { languageOptions } from './common/options';

interface GiftIdea {
    name: string;
    description: string;
    priceRange: string;
    reason: string;
}

interface GiftOutput {
    ideas: GiftIdea[];
}

export const renderGiftIdeaGeneratorOutput = (output: GiftOutput | string) => {
    let data: GiftOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.ideas) || data.ideas.length === 0) {
        return <p className="text-red-400">Could not generate gift ideas. Please try a more specific prompt.</p>;
    }
    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-light mb-4">Here are some gift ideas:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.ideas.map((idea, index) => (
                    <div key={index} className="bg-secondary p-4 rounded-lg border border-slate-700 flex flex-col justify-between hover:border-accent transition-colors duration-300">
                        <div>
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-lg text-light">{idea.name}</h4>
                                <span className="text-sm font-semibold bg-primary text-accent py-1 px-2 rounded-md whitespace-nowrap">{idea.priceRange}</span>
                            </div>
                            <p className="text-slate-400 text-sm mt-2">{idea.description}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-600">
                            <p className="text-xs text-slate-400 italic">"{idea.reason}"</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const GiftIdeaGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'gift-idea-generator')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'numIdeas',
            label: 'Number of Ideas',
            type: 'number',
            defaultValue: 4,
            min: 2,
            max: 8,
        },
        {
            name: 'occasion',
            label: 'Occasion',
            type: 'select',
            defaultValue: 'Birthday',
            options: [
                { value: 'Birthday', label: 'Birthday' },
                { value: 'Anniversary', label: 'Anniversary' },
                { value: 'Holiday', label: 'Holiday' },
                { value: 'Just Because', label: 'Just Because' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            ideas: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        name: { type: GenAiType.STRING, description: "The name of the gift idea." },
                        description: { type: GenAiType.STRING, description: "A brief description of the gift." },
                        priceRange: { type: GenAiType.STRING, description: "An estimated price range (e.g., '$20 - $30')." },
                        reason: { type: GenAiType.STRING, description: "A short sentence explaining why it's a good gift for the person." },
                    },
                    required: ['name', 'description', 'priceRange', 'reason'],
                },
                description: "An array of unique gift ideas."
            }
        },
        required: ['ideas'],
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any; image?: { mimeType: string; data: string } }) => {
        const { numIdeas, language, occasion } = options;
        const fullPrompt = `Generate a list of ${numIdeas} thoughtful gift ideas for a '${occasion}', based on the following information: "${prompt}". For each idea, provide a name, a brief description, an estimated price range, and a reason why it's a suitable gift. The entire response must be in ${language}.`;
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
            renderOutput={renderGiftIdeaGeneratorOutput}
        />
    );
};

export default GiftIdeaGenerator;