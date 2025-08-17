
import React from 'react';
import ToolContainer, { ToolOptionConfig } from '../common/ToolContainer';
import { generateJson, GenAiType } from '../../services/geminiService';
import { tools } from '../index';
import { LightBulbIcon } from '../Icons';

interface GameIdea {
    title: string;
    genre: string;
    mechanic: string;
    pitch: string;
}

export const renderGameIdeaGeneratorOutput = (output: GameIdea | string) => {
    let data: GameIdea;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.title || !data.pitch) {
        return <p className="text-red-400">Could not generate a game idea. Please try again.</p>;
    }
    return (
        <div className="bg-secondary p-6 rounded-lg border border-slate-700 space-y-4">
            <div className="text-center">
                <LightBulbIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">{data.title}</h2>
                <p className="text-sm font-semibold mt-1 py-1 px-3 inline-block bg-primary rounded-full text-sky-300 uppercase tracking-wider">{data.genre}</p>
            </div>
            <div>
                <h3 className="font-bold text-lg text-accent">Core Mechanic</h3>
                <p className="text-slate-300">{data.mechanic}</p>
            </div>
            <div>
                <h3 className="font-bold text-lg text-accent">Pitch</h3>
                <p className="text-slate-300 italic">"{data.pitch}"</p>
            </div>
        </div>
    );
};

const GameIdeaGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'game-idea-generator')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'genre',
            label: 'Genre',
            type: 'select',
            defaultValue: 'Any',
            options: [
                { value: 'Any', label: 'Any' },
                { value: 'Platformer', label: 'Platformer' },
                { value: 'RPG', label: 'RPG' },
                { value: 'Strategy', label: 'Strategy' },
                { value: 'Puzzle', label: 'Puzzle' },
                { value: 'Horror', label: 'Horror' },
            ]
        },
        {
            name: 'complexity',
            label: 'Complexity',
            type: 'select',
            defaultValue: 'Moderate',
            options: [
                { value: 'Simple', label: 'Simple (Mobile Game)' },
                { value: 'Moderate', label: 'Moderate (Indie Game)' },
                { value: 'Complex', label: 'Complex (AAA Game)' },
            ]
        }
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            title: { type: GenAiType.STRING },
            genre: { type: GenAiType.STRING },
            mechanic: { type: GenAiType.STRING, description: "A unique core game mechanic." },
            pitch: { type: GenAiType.STRING, description: "A short, exciting pitch for the game." }
        },
        required: ["title", "genre", "mechanic", "pitch"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { genre, complexity } = options;
        const genreInstruction = genre === 'Any' ? 'of any genre' : `in the ${genre} genre`;
        const fullPrompt = `Generate a unique video game idea ${genreInstruction} with ${complexity} complexity. The idea should be based on the following theme or concept: "${prompt}". Provide a creative title, the specific genre, describe a unique core game mechanic, and write a short pitch.`;
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
            renderOutput={renderGameIdeaGeneratorOutput}
        />
    );
};

export default GameIdeaGenerator;
