
import React from 'react';
import ToolContainer, { ToolOptionConfig } from '../common/ToolContainer';
import { generateJson, GenAiType } from '../../services/geminiService';
import { tools } from '../index';
import { MapIcon } from '../Icons';

interface Quest {
    title: string;
    type: string;
    description: string;
    objective: string;
    reward: string;
}

export const renderQuestGeneratorOutput = (output: Quest | string) => {
    let data: Quest;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.title || !data.objective) {
        return <p className="text-red-400">Could not generate a quest. Please provide more context.</p>;
    }

    return (
        <div className="bg-secondary p-6 rounded-lg border border-slate-700 space-y-4">
            <div className="text-center">
                <MapIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">{data.title}</h2>
                <p className="text-sm font-semibold mt-1 py-1 px-3 inline-block bg-primary rounded-full text-sky-300 uppercase tracking-wider">{data.type}</p>
            </div>
            <div>
                <h3 className="font-bold text-lg text-accent">Quest Description</h3>
                <blockquote className="border-l-4 border-accent/50 pl-4 mt-1">
                    <p className="italic text-slate-300">"{data.description}"</p>
                </blockquote>
            </div>
             <div>
                <h3 className="font-bold text-lg text-accent">Objective</h3>
                <p className="text-slate-300">{data.objective}</p>
            </div>
             <div>
                <h3 className="font-bold text-lg text-accent">Reward</h3>
                <p className="text-slate-300">{data.reward}</p>
            </div>
        </div>
    );
};

const QuestGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'quest-generator')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'questType',
            label: 'Quest Type',
            type: 'select',
            defaultValue: 'Side Quest',
            options: [
                { value: 'Main Quest', label: 'Main Quest' },
                { value: 'Side Quest', label: 'Side Quest' },
                { value: 'Fetch Quest', label: 'Fetch Quest' },
                { value: 'Escort Quest', label: 'Escort Quest' },
                { value: 'Bounty Hunt', label: 'Bounty Hunt' },
            ]
        },
        {
            name: 'setting',
            label: 'Game Setting',
            type: 'text',
            defaultValue: 'A high-fantasy medieval kingdom',
            placeholder: 'e.g., A cyberpunk city, a haunted forest...'
        }
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            title: { type: GenAiType.STRING },
            type: { type: GenAiType.STRING },
            description: { type: GenAiType.STRING, description: "A description of the quest, as if given by an NPC." },
            objective: { type: GenAiType.STRING, description: "A clear, actionable objective for the player." },
            reward: { type: GenAiType.STRING, description: "A fitting reward for completing the quest." }
        },
        required: ["title", "type", "description", "objective", "reward"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { questType, setting } = options;
        const fullPrompt = `Generate a ${questType} for a video game with the setting of "${setting}". Use the following user-provided details to create the quest: "${prompt}". Provide a creative title, the quest type, a description from an NPC, a clear objective, and a suggested reward.`;
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
            renderOutput={renderQuestGeneratorOutput}
        />
    );
};

export default QuestGenerator;
