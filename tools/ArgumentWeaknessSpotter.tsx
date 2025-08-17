import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { ExclamationTriangleIcon } from './Icons';

interface Weakness {
    quote: string;
    fallacy: string;
    explanation: string;
}

interface ArgumentOutput {
    critique: Weakness[];
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

export const renderArgumentWeaknessSpotterOutput = (output: ArgumentOutput | string) => {
    let data: ArgumentOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.critique) || data.critique.length === 0) {
        return <p className="text-slate-400">No significant logical weaknesses were found in the provided text.</p>;
    }
    return (
        <div className="space-y-6">
            <div className="text-center">
                <ExclamationTriangleIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Argument Analysis</h2>
            </div>
            <div className="border border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full divide-y divide-slate-700">
                    <thead className="bg-secondary">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Identified Weakness</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Explanation</th>
                        </tr>
                    </thead>
                    <tbody className="bg-primary divide-y divide-slate-700">
                        {data.critique.map((item, index) => (
                            <tr key={index}>
                                <td className="px-4 py-4 align-top w-1/3">
                                    <p className="font-bold text-accent">{item.fallacy}</p>
                                    <blockquote className="mt-2 text-sm italic text-slate-400 border-l-2 border-slate-600 pl-2">"{item.quote}"</blockquote>
                                </td>
                                <td className="px-4 py-4 align-top text-slate-300">
                                    {item.explanation}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ArgumentWeaknessSpotter: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'argument-weakness-spotter')!;

    const optionsConfig: ToolOptionConfig[] = [
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            critique: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        quote: { type: GenAiType.STRING, description: "The excerpt from the text containing the weakness." },
                        fallacy: { type: GenAiType.STRING, description: "The name of the logical fallacy or type of weakness (e.g., 'Ad Hominem', 'Weak Evidence')." },
                        explanation: { type: GenAiType.STRING, description: "An explanation of why this is a weak point." }
                    },
                    required: ["quote", "fallacy", "explanation"]
                }
            }
        },
        required: ["critique"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { language } = options;
        const fullPrompt = `Act as a critical thinking coach. Analyze the following argument for logical fallacies, weak points, and potential counterarguments. Identify at least 3-4 specific weaknesses. For each, provide the quote, name the fallacy/weakness, and explain why it's a flaw. The entire analysis must be in ${language}.

        Argument: "${prompt}"`;
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
            renderOutput={renderArgumentWeaknessSpotterOutput}
        />
    );
};

export default ArgumentWeaknessSpotter;