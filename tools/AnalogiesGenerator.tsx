import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { LightBulbIcon } from './Icons';

interface Analogy {
    title: string;
    explanation: string;
}

interface AnalogyOutput {
    concept: string;
    analogies: Analogy[];
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

export const renderAnalogiesGeneratorOutput = (output: AnalogyOutput | string) => {
    let data: AnalogyOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.analogies) || data.analogies.length === 0) {
        return <p className="text-red-400">Could not generate analogies for this concept. Please try again.</p>;
    }
    return (
        <div className="space-y-6">
            <div className="text-center">
                 <h2 className="text-xl font-semibold text-light">Understanding: <span className="text-accent">{data.concept}</span></h2>
            </div>
            <div className="space-y-4">
                {data.analogies.map((analogy, index) => (
                    <div key={index} className="bg-secondary p-4 rounded-lg border border-slate-700">
                       <div className="flex items-center mb-2">
                            <LightBulbIcon className="h-6 w-6 text-amber-400 mr-3 flex-shrink-0" />
                            <h3 className="font-bold text-lg text-light">{analogy.title}</h3>
                        </div>
                        <p className="text-slate-300 pl-9">{analogy.explanation}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AnalogiesGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'analogies-generator')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'domain',
            label: 'Analogy Domain',
            type: 'select',
            defaultValue: 'Any',
            options: [
                { value: 'Any', label: 'Any' },
                { value: 'Technology', label: 'Technology' },
                { value: 'Nature', label: 'Nature' },
                { value: 'Everyday Life', label: 'Everyday Life' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            concept: { type: GenAiType.STRING, description: "The concept being explained." },
            analogies: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        title: { type: GenAiType.STRING, description: "A title for the analogy (e.g., 'Like a Library')." },
                        explanation: { type: GenAiType.STRING, description: "The full explanation of the analogy." },
                    },
                    required: ['title', 'explanation'],
                },
                description: "An array of 2-3 simple analogies."
            },
        },
        required: ['concept', 'analogies'],
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { language, domain } = options;
        const domainInstruction = domain === 'Any' ? '' : `The analogies should be drawn from the domain of '${domain}'.`;
        const fullPrompt = `Explain the complex concept of "${prompt}" using three simple, easy-to-understand analogies. ${domainInstruction} For each analogy, provide a short title and a clear explanation. The entire response must be in ${language}.`;
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
            renderOutput={renderAnalogiesGeneratorOutput}
        />
    );
};

export default AnalogiesGenerator;