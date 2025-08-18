
import React from 'react';
import ToolContainer from './common/ToolContainer';
import type { ToolOptionConfig } from '../../types';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { PencilSquareIcon } from './Icons';
import { languageOptions } from './common/options';

interface StoryOutput {
    title: string;
    genre: string;
    characters: string[];
    story: string;
}

export const renderCreativeStoryGeneratorOutput = (output: StoryOutput | string) => {
    let data: StoryOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.title || !data.story) {
        return <p className="text-red-400">Could not generate a valid story. Please try again.</p>;
    }
    return (
        <div className="bg-slate-800 p-6 sm:p-8 rounded-lg border border-slate-700 shadow-xl font-serif">
            <div className="text-center border-b-2 border-dashed border-slate-600 pb-4 mb-6">
                <PencilSquareIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-3xl font-bold text-light">{data.title}</h2>
                <p className="text-sm font-semibold mt-2 py-1 px-3 inline-block bg-primary rounded-full text-sky-300 uppercase tracking-wider">{data.genre}</p>
            </div>
            <div className="mb-6">
                <h4 className="text-lg font-bold text-slate-300 mb-2 font-sans">Characters:</h4>
                <p className="text-slate-400 italic">{data.characters.join(', ')}</p>
            </div>
            <div className="prose prose-invert prose-p:text-slate-300 prose-p:leading-relaxed max-w-none text-justify">
                {data.story.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 indent-8">{paragraph}</p>
                ))}
            </div>
        </div>
    );
};

const CreativeStoryGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'creative-story-generator')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'length',
            label: 'Story Length',
            type: 'select',
            defaultValue: 'Short (~300 words)',
            options: [
                { value: 'Short (~300 words)', label: 'Short (~300 words)' },
                { value: 'Medium (~500 words)', label: 'Medium (~500 words)' },
                { value: 'Long (~800 words)', label: 'Long (~800 words)' },
            ]
        },
        {
            name: 'tone',
            label: 'Tone',
            type: 'select',
            defaultValue: 'Neutral',
            options: [
                { value: 'Neutral', label: 'Neutral' },
                { value: 'Humorous', label: 'Humorous' },
                { value: 'Serious', label: 'Serious' },
                { value: 'Mysterious', label: 'Mysterious' },
                { value: 'Whimsical', label: 'Whimsical' },
            ]
        },
        {
            name: 'pov',
            label: 'Point of View',
            type: 'select',
            defaultValue: 'Third Person Limited',
            options: [
                { value: 'First Person', label: 'First Person' },
                { value: 'Third Person Limited', label: 'Third Person Limited' },
                { value: 'Third Person Omniscient', label: 'Third Person Omniscient' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            title: { type: GenAiType.STRING, description: "A creative title for the story." },
            genre: { type: GenAiType.STRING, description: "The genre of the story." },
            characters: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "A list of the main characters' names." },
            story: { type: GenAiType.STRING, description: "The full text of the short story." },
        },
        required: ['title', 'genre', 'characters', 'story'],
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any; image?: { mimeType: string; data: string } }) => {
        const { length, tone, language, pov } = options;
        const fullPrompt = `Write a creative short story based on the following prompt: "${prompt}". 
        The story should be of ${length}, have a ${tone} tone, and be told from a '${pov}' point of view. 
        Generate a fitting title, identify the genre, list the main characters, and write a compelling story.
        The entire response must be in ${language}.`;
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
            renderOutput={renderCreativeStoryGeneratorOutput}
        />
    );
};

export default CreativeStoryGenerator;