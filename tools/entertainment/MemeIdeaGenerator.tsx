import React from 'react';
import ToolContainer, { ToolOptionConfig } from '../common/ToolContainer';
import { generateJson, GenAiType } from '../../services/geminiService';
import { tools } from '../index';
import { FaceSmileIcon } from '../Icons';

interface MemeIdeaOutput {
    memeFormat: string;
    topText: string;
    bottomText: string;
}

export const renderMemeIdeaGeneratorOutput = (output: MemeIdeaOutput | string) => {
    let data: MemeIdeaOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.topText) {
        return <p className="text-red-400">Could not generate a meme idea. Please try a different topic.</p>;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-center text-light">
                {data.memeFormat}
            </h3>
            <div className="bg-primary border border-slate-700 rounded-lg p-6 font-bold text-center text-2xl uppercase tracking-wider space-y-4">
                <p className="text-light">{data.topText}</p>
                <p className="text-light">{data.bottomText}</p>
            </div>
        </div>
    );
};

const MemeIdeaGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'meme-idea-generator')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'memeFormat',
            label: 'Meme Format',
            type: 'select',
            defaultValue: 'Distracted Boyfriend',
            options: [
                { value: 'Distracted Boyfriend', label: 'Distracted Boyfriend' },
                { value: 'Drakeposting', label: 'Drakeposting' },
                { value: 'Woman Yelling at a Cat', label: 'Woman Yelling at a Cat' },
                { value: 'Expanding Brain', label: 'Expanding Brain' },
                { value: 'Two Buttons', label: 'Two Buttons' },
            ]
        }
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            memeFormat: { type: GenAiType.STRING },
            topText: { type: GenAiType.STRING, description: "The text that goes on the top of the meme." },
            bottomText: { type: GenAiType.STRING, description: "The text that goes on the bottom of the meme." },
        },
        required: ["memeFormat", "topText", "bottomText"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { memeFormat } = options;
        const fullPrompt = `Generate funny meme text for the "${memeFormat}" meme format. The meme should be about this topic: "${prompt}". Provide the top text and bottom text.`;
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
            renderOutput={renderMemeIdeaGeneratorOutput}
        />
    );
};

export default MemeIdeaGenerator;
