import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { FaceSmileIcon } from './Icons';

interface ExplanationOutput {
    topic: string;
    explanation: string;
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
        { value: 'German', label: 'German' },
        { value: 'Japanese', label: 'Japanese' },
    ]
};

export const renderFiveYearOldExplainerOutput = (output: ExplanationOutput | string) => {
    let data: ExplanationOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.explanation) {
        return <p className="text-red-400">Could not generate a simple explanation. Please try another topic.</p>;
    }
    return (
        <div className="space-y-6">
            <div className="text-center">
                <FaceSmileIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Let's learn about: <span className="text-accent">{data.topic}</span></h2>
            </div>
            <div className="bg-primary p-6 rounded-lg border border-slate-700">
                <p className="text-lg text-slate-300 leading-relaxed text-center">{data.explanation}</p>
            </div>
        </div>
    );
};

const FiveYearOldExplainer: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'five-year-old-explainer')!;

    const optionsConfig: ToolOptionConfig[] = [languageOptions];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            topic: { type: GenAiType.STRING },
            explanation: { type: GenAiType.STRING, description: "The explanation, using simple words and concepts." }
        },
        required: ["topic", "explanation"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { language } = options;
        const fullPrompt = `Explain the following complex topic as if you were explaining it to a five-year-old. Use very simple words, short sentences, and relatable analogies. The entire response must be in ${language}.

        Topic: "${prompt}"`;
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
            renderOutput={renderFiveYearOldExplainerOutput}
        />
    );
};

export default FiveYearOldExplainer;