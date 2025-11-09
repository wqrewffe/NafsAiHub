import React from 'react';
import ToolContainer from '../common/ToolContainer';
import { generateJson, GenAiType } from '../../services/geminiService';
import { tools } from '../index';
import { ShieldCheckIcon } from '../Icons';

interface SuperpowerOutput {
    powerName: string;
    description: string;
    weakness: string;
}

export const renderMySuperpowerGeneratorOutput = (output: SuperpowerOutput | string) => {
    let data: SuperpowerOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.powerName) {
        return <p className="text-red-400">Could not generate a superpower. Please describe your personality more.</p>;
    }

    return (
        <div className="bg-secondary p-6 rounded-lg border border-slate-700 space-y-4">
            <div className="text-center">
                <ShieldCheckIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <p className="text-sm uppercase text-slate-400">Your Superpower Is</p>
                <h2 className="text-3xl font-bold text-light">{data.powerName}</h2>
            </div>
            <div className="bg-primary p-4 rounded-md">
                <h3 className="font-semibold text-accent">Description</h3>
                <p className="text-slate-300 mt-1">{data.description}</p>
            </div>
            <div className="bg-primary p-4 rounded-md border-l-4 border-red-500/50">
                <h3 className="font-semibold text-red-400">Weakness</h3>
                <p className="text-slate-300 mt-1">{data.weakness}</p>
            </div>
        </div>
    );
};

const MySuperpowerGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'my-superpower-generator')!;

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            powerName: { type: GenAiType.STRING },
            description: { type: GenAiType.STRING, description: "A creative description of what the superpower does." },
            weakness: { type: GenAiType.STRING, description: "A funny or ironic weakness related to the power or personality." },
        },
        required: ["powerName", "description", "weakness"]
    };

    const handleGenerate = async ({ prompt }: { prompt: string; options: any }) => {
        const fullPrompt = `Based on the following personality description, invent a unique and creative superpower. Give the power a cool name, describe what it does, and add a funny or ironic weakness. Personality: "${prompt}".`;
        return generateJson(fullPrompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            onGenerate={handleGenerate}
            renderOutput={renderMySuperpowerGeneratorOutput}
        />
    );
};

export default MySuperpowerGenerator;
