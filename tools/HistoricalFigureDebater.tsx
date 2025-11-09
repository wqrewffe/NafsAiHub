import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { UsersIcon } from './Icons';

interface DebateOutput {
    figure: string;
    topic: string;
    openingStatement: string;
    keyArguments: {
        point: string;
        elaboration: string;
    }[];
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

export const renderHistoricalFigureDebaterOutput = (output: DebateOutput | string) => {
    let data: DebateOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.figure || !Array.isArray(data.keyArguments)) {
        return <p className="text-red-400">Could not generate a valid debate. Please try a different figure or topic.</p>;
    }
    return (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <div className="text-center mb-6">
                <UsersIcon className="h-12 w-12 mx-auto text-accent mb-2"/>
                <h2 className="text-2xl font-bold text-light">Debate: <span className="text-accent">{data.topic}</span></h2>
                <p className="text-slate-400">A response from {data.figure}</p>
            </div>

            <div className="mb-6">
                <h3 className="font-bold text-lg text-light mb-2">Opening Statement</h3>
                <blockquote className="border-l-4 border-accent pl-4 text-slate-300 italic">
                    {data.openingStatement}
                </blockquote>
            </div>

            <div>
                <h3 className="font-bold text-lg text-light mb-3">Key Arguments</h3>
                <div className="space-y-4">
                    {data.keyArguments.map((arg, index) => (
                        <div key={index} className="bg-primary/50 p-4 rounded-lg">
                            <h4 className="font-semibold text-accent">{arg.point}</h4>
                            <p className="text-slate-400 mt-1">{arg.elaboration}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const HistoricalFigureDebater: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'historical-figure-debater')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'style',
            label: 'Debate Style',
            type: 'select',
            defaultValue: 'Formal',
            options: [
                { value: 'Formal', label: 'Formal' },
                { value: 'Passionate', label: 'Passionate' },
                { value: 'Aggressive', label: 'Aggressive' },
                { value: 'Scholarly', label: 'Scholarly' },
            ]
        },
        {
            name: 'topicFocus',
            label: 'Topic Focus',
            type: 'select',
            defaultValue: 'Political',
            options: [
                { value: 'Philosophical', label: 'Philosophical' },
                { value: 'Personal', label: 'Personal' },
                { value: 'Political', label: 'Political' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            figure: { type: GenAiType.STRING, description: "The historical figure in the debate." },
            topic: { type: GenAiType.STRING, description: "The central topic of the debate." },
            openingStatement: { type: GenAiType.STRING, description: "A strong opening statement from the figure's perspective." },
            keyArguments: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        point: { type: GenAiType.STRING, description: "A concise summary of an argument." },
                        elaboration: { type: GenAiType.STRING, description: "A detailed elaboration on that point, with historical context." }
                    },
                    required: ["point", "elaboration"]
                }
            }
        },
        required: ["figure", "topic", "openingStatement", "keyArguments"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { style, language, topicFocus } = options;
        const fullPrompt = `Act as a historical figure debater. From the user's prompt, identify the figure and the topic. Then, adopting the persona of that figure with a ${style} debate style and a '${topicFocus}' focus, generate a strong opening statement and 3 key arguments to support your position. The entire response must be in ${language}.
        
        User Prompt: "${prompt}"`;
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
            renderOutput={renderHistoricalFigureDebaterOutput}
        />
    );
};

export default HistoricalFigureDebater;