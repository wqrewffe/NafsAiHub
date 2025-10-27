
import React from 'react';
import ToolContainer, { ToolOptionConfig } from '../common/ToolContainer';
import { generateJson, GenAiType } from '../../services/geminiService';
import { tools } from '../index';
import { UserCircleIcon } from '../Icons';

interface CharacterBackstory {
    name: string;
    archetype: string;
    background: string;
    motivation: string;
}

export const renderCharacterBackstoryGeneratorOutput = (output: CharacterBackstory | string) => {
    let data: CharacterBackstory;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.name || !data.background) {
        return <p className="text-red-400">Could not generate a backstory. Please be more specific.</p>;
    }

    return (
        <div className="bg-secondary p-6 rounded-lg border border-slate-700 space-y-6">
            <div className="text-center border-b border-slate-600 pb-4">
                <UserCircleIcon className="h-12 w-12 mx-auto text-accent mb-2" />
                <h2 className="text-3xl font-bold text-light">{data.name}</h2>
                <p className="text-slate-400">{data.archetype}</p>
            </div>
            <div className="space-y-4">
                <div>
                    <h3 className="text-xl font-semibold text-accent">Background</h3>
                    <p className="text-slate-300 mt-1 whitespace-pre-wrap">{data.background}</p>
                </div>
                 <div>
                    <h3 className="text-xl font-semibold text-accent">Core Motivation</h3>
                    <p className="text-slate-300 mt-1 italic">"{data.motivation}"</p>
                </div>
            </div>
        </div>
    );
};

const CharacterBackstoryGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'character-backstory-generator')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'archetype',
            label: 'Archetype',
            type: 'select',
            defaultValue: 'The Hero',
            options: [
                { value: 'The Hero', label: 'Hero' },
                { value: 'The Villain', label: 'Villain' },
                { value: 'The Anti-Hero', label: 'Anti-Hero' },
                { value: 'The Mentor', label: 'Mentor' },
                { value: 'The Trickster', label: 'Trickster' },
            ]
        },
        {
            name: 'genre',
            label: 'Setting/Genre',
            type: 'select',
            defaultValue: 'Fantasy',
            options: [
                { value: 'Fantasy', label: 'Fantasy' },
                { value: 'Sci-Fi', label: 'Sci-Fi' },
                { value: 'Modern', label: 'Modern' },
                { value: 'Post-Apocalyptic', label: 'Post-Apocalyptic' },
                { value: 'Cyberpunk', label: 'Cyberpunk' },
            ]
        }
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            name: { type: GenAiType.STRING },
            archetype: { type: GenAiType.STRING },
            background: { type: GenAiType.STRING, description: "A detailed backstory for the character, in 2-3 paragraphs." },
            motivation: { type: GenAiType.STRING, description: "The character's primary goal or motivation." }
        },
        required: ["name", "archetype", "background", "motivation"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { archetype, genre } = options;
        const fullPrompt = `Generate a backstory for a video game character. The character is a '${archetype}' in a '${genre}' setting. Use the following user-provided details to flesh them out: "${prompt}". Provide a fitting name, the archetype, a detailed background story, and their core motivation.`;
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
            renderOutput={renderCharacterBackstoryGeneratorOutput}
        />
    );
};

export default CharacterBackstoryGenerator;
