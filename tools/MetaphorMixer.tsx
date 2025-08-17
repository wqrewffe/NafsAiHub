import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { FunnelIcon } from './Icons';

interface Metaphor {
    domain: string;
    metaphor: string;
    explanation: string;
}

interface MetaphorOutput {
    concept: string;
    metaphors: Metaphor[];
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

export const renderMetaphorMixerOutput = (output: MetaphorOutput | string) => {
    let data: MetaphorOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.metaphors) || data.metaphors.length === 0) {
        return <p className="text-red-400">Could not generate metaphors. Please provide a clearer concept to explain.</p>;
    }
    return (
        <div className="space-y-6">
            <div className="text-center">
                <FunnelIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Explaining: <span className="text-accent">{data.concept}</span></h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {data.metaphors.map((item, index) => (
                    <div key={index} className="bg-secondary p-4 rounded-lg border-t-4 border-accent">
                        <h3 className="text-xl font-bold text-light">{item.domain} Metaphor</h3>
                        <blockquote className="mt-2 text-slate-300 italic">"{item.metaphor}"</blockquote>
                        <p className="mt-4 text-sm text-slate-400">{item.explanation}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MetaphorMixer: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'metaphor-mixer')!;

    const optionsConfig: ToolOptionConfig[] = [
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            concept: { type: GenAiType.STRING },
            metaphors: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        domain: { type: GenAiType.STRING, description: "The domain of the metaphor (e.g., 'Cooking', 'Gardening')." },
                        metaphor: { type: GenAiType.STRING, description: "The core metaphor (e.g., 'It's like a recipe...')." },
                        explanation: { type: GenAiType.STRING, description: "How the metaphor explains the concept." },
                    },
                    required: ["domain", "metaphor", "explanation"]
                },
                description: "An array of 3 distinct metaphors."
            }
        },
        required: ["concept", "metaphors"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { language } = options;
        const fullPrompt = `Explain the complex concept of "${prompt}" using three distinct metaphors from different real-world domains (e.g., cooking, sports, nature, etc.). For each metaphor, provide the domain, the core metaphor statement, and a brief explanation of how it works. The entire response must be in ${language}.`;
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
            renderOutput={renderMetaphorMixerOutput}
        />
    );
};

export default MetaphorMixer;