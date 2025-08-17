import React from 'react';
import ToolContainer from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { ChatBubbleOvalLeftEllipsisIcon } from './Icons';

interface PunGeneratorOutput {
    topic: string;
    puns: string[];
}

export const renderPunGeneratorOutput = (output: PunGeneratorOutput | string) => {
    let data: PunGeneratorOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.puns) || data.puns.length === 0) {
        return <p className="text-red-400">Could not generate puns for this topic. Please try something else.</p>;
    }
    return (
        <div className="space-y-6">
            <div className="text-center">
                <ChatBubbleOvalLeftEllipsisIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Puns about <span className="text-accent">{data.topic}</span></h2>
            </div>
            <div className="space-y-3">
                {data.puns.map((pun, index) => (
                    <div key={index} className="bg-secondary p-4 rounded-lg rounded-tl-none italic text-slate-300 text-lg text-center shadow-md">
                        "{pun}"
                    </div>
                ))}
            </div>
        </div>
    );
};

const PunGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'pun-generator')!;

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            topic: { type: GenAiType.STRING },
            puns: {
                type: GenAiType.ARRAY,
                items: { type: GenAiType.STRING },
                description: "An array of 5 clever and family-friendly puns."
            }
        },
        required: ["topic", "puns"]
    };

    const handleGenerate = async ({ prompt }: { prompt: string; options: any }) => {
        const fullPrompt = `Generate 5 clever and funny puns related to the topic: "${prompt}".`;
        return generateJson(fullPrompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            onGenerate={handleGenerate}
            renderOutput={renderPunGeneratorOutput}
        />
    );
};

export default PunGenerator;
