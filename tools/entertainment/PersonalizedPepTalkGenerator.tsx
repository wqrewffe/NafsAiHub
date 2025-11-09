import React from 'react';
import ToolContainer, { ToolOptionConfig } from '../common/ToolContainer';
import { generateJson, GenAiType } from '../../services/geminiService';
import { tools } from '../index';
import { SparklesIcon } from '../Icons';

interface PepTalkOutput {
    title: string;
    pepTalk: string;
}

export const renderPersonalizedPepTalkGeneratorOutput = (output: PepTalkOutput | string) => {
    let data: PepTalkOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.pepTalk) {
        return <p className="text-red-400">Could not generate a pep talk. Please try again.</p>;
    }

    return (
        <div className="bg-secondary p-6 rounded-lg border border-slate-700 space-y-4">
            <div className="text-center">
                <SparklesIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">{data.title}</h2>
            </div>
            <div className="bg-primary p-4 rounded-md">
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{data.pepTalk}</p>
            </div>
        </div>
    );
};

const PersonalizedPepTalkGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'personalized-pep-talk')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'tone',
            label: 'Tone',
            type: 'select',
            defaultValue: 'Warm & Encouraging',
            options: [
                { value: 'Warm & Encouraging', label: 'Warm & Encouraging' },
                { value: 'Funny & Sarcastic', label: 'Funny & Sarcastic' },
                { value: 'Tough Love', label: 'Tough Love' },
                { value: 'Philosophical', label: 'Philosophical' },
            ]
        }
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            title: { type: GenAiType.STRING, description: "A creative, uplifting title for the pep talk." },
            pepTalk: { type: GenAiType.STRING, description: "The full text of the personalized pep talk." },
        },
        required: ["title", "pepTalk"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { tone } = options;
        const fullPrompt = `A user is feeling down. Their reason is: "${prompt}". Write a personalized pep talk for them with a "${tone}" tone. The pep talk should be uplifting and thoughtful. Give it a creative title and the main message.`;
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
            renderOutput={renderPersonalizedPepTalkGeneratorOutput}
        />
    );
};

export default PersonalizedPepTalkGenerator;
