import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { QuestionMarkCircleIcon } from './Icons';

interface SocraticOutput {
    topic: string;
    guidingQuestions: string[];
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

export const renderSocraticMethodTutorOutput = (output: SocraticOutput | string) => {
    let data: SocraticOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.guidingQuestions) || data.guidingQuestions.length === 0) {
        return <p className="text-red-400">Could not generate guiding questions. Please rephrase your problem.</p>;
    }
    return (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <div className="text-center mb-6">
                <QuestionMarkCircleIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Let's Think About: {data.topic}</h2>
                <p className="text-slate-400">Consider these questions to find your answer.</p>
            </div>
            
            <div className="space-y-3">
                {data.guidingQuestions.map((question, index) => (
                    <div key={index} className="flex items-start p-3 bg-primary/50 rounded-lg">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent text-primary font-bold text-sm flex items-center justify-center mr-3 mt-1">
                            ?
                        </div>
                        <p className="text-slate-300 text-lg">{question}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SocraticMethodTutor: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'socratic-method-tutor')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'depth',
            label: 'Question Depth',
            type: 'select',
            defaultValue: 'Deep Dive',
            options: [
                { value: 'Surface Level', label: 'Surface Level' },
                { value: 'Deep Dive', label: 'Deep Dive' },
                { value: 'Connecting Concepts', label: 'Connecting Concepts' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            topic: { type: GenAiType.STRING, description: "The core topic or problem the user is asking about." },
            guidingQuestions: {
                type: GenAiType.ARRAY,
                items: { type: GenAiType.STRING },
                description: "An array of 4-5 thought-provoking questions that guide the user without giving the answer."
            }
        },
        required: ["topic", "guidingQuestions"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { language, depth } = options;
        const fullPrompt = `Act as a tutor using the Socratic method. A student needs help with the following topic/problem. Instead of giving a direct answer, your task is to generate a series of 4-5 guiding questions with a '${depth}' level of inquiry that will help them think critically and arrive at the solution on their own. The questions should build on each other logically. The entire response must be in ${language}.

        Student's Problem: "${prompt}"`;
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
            renderOutput={renderSocraticMethodTutorOutput}
        />
    );
};

export default SocraticMethodTutor;