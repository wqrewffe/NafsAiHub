
import React from 'react';
import ToolContainer from './common/ToolContainer';
import type { ToolOptionConfig } from '../types';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { MoonIcon } from './Icons';
import { languageOptions } from './common/options';

interface Interpretation {
    theme: string;
    meaning: string;
}

interface DreamOutput {
    dreamSummary: string;
    interpretations: Interpretation[];
}

export const renderDreamInterpreterOutput = (output: DreamOutput | string) => {
    let data: DreamOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.dreamSummary || !Array.isArray(data.interpretations)) {
        return <p className="text-red-400">Could not generate a dream interpretation. Please try again.</p>;
    }
    return (
        <div className="bg-slate-800 p-6 rounded-lg border border-indigo-500/30 shadow-lg bg-cover bg-center" style={{backgroundImage: 'linear-gradient(rgba(30, 41, 59, 0.9), rgba(30, 41, 59, 0.9)), url(https://www.transparenttextures.com/patterns/stardust.png)'}}>
            <div className="text-center mb-6">
                <MoonIcon className="h-10 w-10 mx-auto text-accent mb-2"/>
                <h2 className="text-2xl font-bold text-light">Dream Analysis</h2>
            </div>
            
            <div className="mb-8 bg-primary/50 p-4 rounded-md">
                <p className="text-slate-400 text-sm mb-1">Your Dream:</p>
                <p className="text-slate-300 italic">"{data.dreamSummary}"</p>
            </div>

            <div>
                <h3 className="text-xl font-semibold text-accent mb-4">Possible Interpretations:</h3>
                <div className="space-y-4">
                    {data.interpretations.map((item, index) => (
                        <div key={index} className="bg-primary/50 p-4 rounded-lg border-l-4 border-accent">
                            <h4 className="font-bold text-lg text-light">{item.theme}</h4>
                            <p className="text-slate-300 mt-1">{item.meaning}</p>
                        </div>
                    ))}
                </div>
            </div>
             <p className="text-xs text-slate-500 text-center mt-8">Disclaimer: Dream interpretation is subjective and not a science. This is for entertainment purposes only.</p>
        </div>
    );
};

const DreamInterpreter: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'dream-interpreter')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'style',
            label: 'Interpretation Style',
            type: 'select',
            defaultValue: 'Psychological',
            options: [
                { value: 'Psychological', label: 'Psychological' },
                { value: 'Symbolic', label: 'Symbolic' },
                { value: 'Spiritual', label: 'Spiritual' },
            ]
        },
        {
            name: 'focus',
            label: 'Interpretation Focus',
            type: 'select',
            defaultValue: 'Symbolism',
            options: [
                { value: 'Emotional State', label: 'Emotional State' },
                { value: 'Life Events', label: 'Life Events' },
                { value: 'Symbolism', label: 'Symbolism' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            dreamSummary: { type: GenAiType.STRING, description: "A brief summary of the dream provided." },
            interpretations: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        theme: { type: GenAiType.STRING, description: "A key theme or symbol from the dream (e.g., 'Flying', 'Water')." },
                        meaning: { type: GenAiType.STRING, description: "A possible psychological or symbolic interpretation of that theme." },
                    },
                    required: ['theme', 'meaning'],
                },
                description: "A list of key themes identified in the dream and their interpretations."
            },
        },
        required: ['dreamSummary', 'interpretations'],
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any; image?: { mimeType: string; data: string } }) => {
        const { style, language, focus } = options;
        const fullPrompt = `Provide a ${style} interpretation for the following dream, with a focus on '${focus}'. Summarize the dream, then identify 3-4 key themes or symbols and explain their possible meanings from that perspective. Present this in a thoughtful, non-definitive way. The entire response must be in ${language}.

        Dream: "${prompt}"`;
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
            renderOutput={renderDreamInterpreterOutput}
        />
    );
};

export default DreamInterpreter;