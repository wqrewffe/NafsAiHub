import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { NewspaperIcon, LightBulbIcon } from './Icons';

interface EssayTheme {
    themeTitle: string;
    angle: string;
    starterSentences: string[];
}

interface EssayOutput {
    themes: EssayTheme[];
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
        { value: 'Mandarin Chinese', label: 'Mandarin Chinese' },
        { value: 'Japanese', label: 'Japanese' },
        { value: 'Hindi', label: 'Hindi' },
        { value: 'Arabic', label: 'Arabic' },
        { value: 'Portuguese', label: 'Portuguese' },
        { value: 'Bengali', label: 'Bengali (Bangla)' },
        { value: 'Russian', label: 'Russian' },
    ]
};

export const renderCollegeAppEssayBrainstormerOutput = (output: EssayOutput | string) => {
    let data: EssayOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.themes) || data.themes.length === 0) {
        return <p className="text-red-400">Could not generate essay ideas. Please provide more detail about your experiences.</p>;
    }
    return (
        <div className="space-y-6">
             <div className="text-center">
                <NewspaperIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Personal Essay Idea Starter</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {data.themes.map((theme, index) => (
                    <div key={index} className="bg-secondary p-4 rounded-lg border border-slate-700 flex flex-col">
                        <div className="flex-grow">
                            <h3 className="text-xl font-bold text-accent">{theme.themeTitle}</h3>
                            <p className="text-sm text-slate-400 mt-2 mb-4">{theme.angle}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-600">
                            <h4 className="flex items-center text-sm font-semibold text-light mb-2">
                                <LightBulbIcon className="h-4 w-4 mr-2 text-amber-400" />
                                Starter Sentences
                            </h4>
                            <ul className="space-y-2">
                                {theme.starterSentences.map((s, i) => (
                                   <li key={i} className="text-sm text-slate-300 italic">"{s}"</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CollegeAppEssayBrainstormer: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'college-app-essay-brainstormer')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'essayType',
            label: 'Essay Type / Prompt',
            type: 'select',
            defaultValue: 'General Personal Statement',
            options: [
                { value: 'General Personal Statement', label: 'General Personal Statement' },
                { value: 'Overcoming a Challenge', label: 'Overcoming a Challenge' },
                { value: 'Why this major?', label: 'Why this major?' },
                { value: 'A time you learned something', label: 'A time you learned something' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            themes: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        themeTitle: { type: GenAiType.STRING, description: "A catchy title for the essay theme." },
                        angle: { type: GenAiType.STRING, description: "A short paragraph explaining the unique angle or narrative hook." },
                        starterSentences: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "Two or three compelling opening sentences." }
                    },
                    required: ["themeTitle", "angle", "starterSentences"]
                },
                description: "An array of 3 distinct essay themes."
            }
        },
        required: ["themes"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { language, essayType } = options;
        const fullPrompt = `Act as a college admissions essay consultant. A student provides their interests and activities below. Your task is to brainstorm 3 unique, compelling, and personal themes for a college application essay that addresses the prompt: '${essayType}'. For each theme, provide a title, a short explanation of the narrative angle, and a few powerful starter sentences. Avoid clichés. The entire response must be in ${language}.

        Student Info: "${prompt}"`;
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
            renderOutput={renderCollegeAppEssayBrainstormerOutput}
        />
    );
};

export default CollegeAppEssayBrainstormer;