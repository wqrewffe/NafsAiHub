import React from 'react';
import ToolContainer, { ToolOptionConfig } from '../common/ToolContainer';
import { generateJson, GenAiType } from '../../services/geminiService';
import { tools } from '../index';
import { RocketLaunchIcon } from '../Icons';

interface RobotConcept {
    name: string;
    purpose: string;
    designAesthetic: string;
    uniqueQuirk: string;
}

export const renderSciFiRobotInspiratorOutput = (output: RobotConcept | string) => {
    let data: RobotConcept;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.name) {
        return <p className="text-red-400">Could not generate a robot concept. Please try a different theme.</p>;
    }

    return (
        <div className="bg-secondary p-6 rounded-lg border border-slate-700 space-y-4">
            <div className="text-center">
                <RocketLaunchIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-3xl font-bold text-light">{data.name}</h2>
            </div>
            <div className="bg-primary p-4 rounded-md">
                <h3 className="font-semibold text-accent">Primary Purpose</h3>
                <p className="text-slate-300 mt-1">{data.purpose}</p>
            </div>
             <div className="bg-primary p-4 rounded-md">
                <h3 className="font-semibold text-accent">Design Aesthetic</h3>
                <p className="text-slate-300 mt-1">{data.designAesthetic}</p>
            </div>
             <div className="bg-primary p-4 rounded-md">
                <h3 className="font-semibold text-accent">Unique Quirk</h3>
                <p className="text-slate-300 mt-1">{data.uniqueQuirk}</p>
            </div>
        </div>
    );
};

const SciFiRobotInspirator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'sci-fi-robot-inspirator')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'era',
            label: 'Sci-Fi Era',
            type: 'select',
            defaultValue: 'Near-Future',
            options: [
                { value: 'Near-Future', label: 'Near-Future' },
                { value: 'Cyberpunk', label: 'Cyberpunk' },
                { value: 'Space Opera', label: 'Space Opera' },
                { value: 'Post-Apocalyptic', label: 'Post-Apocalyptic' },
            ]
        }
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            name: { type: GenAiType.STRING },
            purpose: { type: GenAiType.STRING },
            designAesthetic: { type: GenAiType.STRING, description: "A description of the robot's visual appearance." },
            uniqueQuirk: { type: GenAiType.STRING, description: "An unusual habit, feature, or personality trait." }
        },
        required: ["name", "purpose", "designAesthetic", "uniqueQuirk"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { era } = options;
        const fullPrompt = `Generate a creative and unique science fiction robot concept. The robot should fit into a "${era}" era and be inspired by the theme: "${prompt}". Provide a name, its primary purpose, a description of its design aesthetic, and a unique, memorable quirk.`;
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
            renderOutput={renderSciFiRobotInspiratorOutput}
        />
    );
};

export default SciFiRobotInspirator;
