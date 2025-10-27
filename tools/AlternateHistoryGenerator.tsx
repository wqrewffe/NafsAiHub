import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { ClockIcon } from './Icons';

interface TimelineEvent {
    year: string;
    eventDescription: string;
}

interface HistoryOutput {
    pivotalEvent: string;
    alternateTimeline: TimelineEvent[];
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

export const renderAlternateHistoryGeneratorOutput = (output: HistoryOutput | string) => {
    let data: HistoryOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.pivotalEvent || !Array.isArray(data.alternateTimeline)) {
        return <p className="text-red-400">Could not generate a timeline. Please provide a clearer historical scenario.</p>;
    }
    return (
        <div className="space-y-6">
            <div className="text-center">
                <ClockIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Alternate Timeline:</h2>
                <p className="text-accent text-lg">{data.pivotalEvent}</p>
            </div>
            
            <div className="border-l-2 border-slate-600 ml-4 pl-8 space-y-8 relative">
                {/* Vertical line */}
                <div className="absolute top-0 left-0 h-full w-0.5 bg-slate-600 -translate-x-1/2"></div>
                
                {data.alternateTimeline.map((event, index) => (
                    <div key={index} className="relative">
                        {/* Dot on the timeline */}
                        <div className="absolute -left-[38px] top-1 h-4 w-4 rounded-full bg-accent ring-4 ring-primary"></div>
                        <p className="font-bold text-accent text-lg">{event.year}</p>
                        <p className="text-slate-300">{event.eventDescription}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AlternateHistoryGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'alternate-history-generator')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'numEvents',
            label: 'Number of Timeline Events',
            type: 'number',
            defaultValue: 5,
            min: 3,
            max: 10,
        },
        {
            name: 'scope',
            label: 'Scope of Impact',
            type: 'select',
            defaultValue: 'Global Impact',
            options: [
                { value: 'Global Impact', label: 'Global Impact' },
                { value: 'Regional Impact', label: 'Regional Impact' },
                { value: 'Personal Impact', label: 'Personal Impact' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            pivotalEvent: { type: GenAiType.STRING, description: "The core 'what if' scenario." },
            alternateTimeline: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        year: { type: GenAiType.STRING, description: "The year or date of the new event." },
                        eventDescription: { type: GenAiType.STRING, description: "A description of what happened in the alternate timeline." }
                    },
                    required: ["year", "eventDescription"]
                },
                description: "An array of key events in the new timeline."
            }
        },
        required: ["pivotalEvent", "alternateTimeline"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { numEvents, language, scope } = options;
        const fullPrompt = `Generate a plausible alternate history timeline based on the following "what if" scenario. The timeline should focus on the '${scope}' of the change. Identify the pivotal event and then create a timeline with ${numEvents} significant consequential events, including the year and a description for each. The entire response must be in ${language}.

        Scenario: "${prompt}"`;
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
            renderOutput={renderAlternateHistoryGeneratorOutput}
        />
    );
};

export default AlternateHistoryGenerator;