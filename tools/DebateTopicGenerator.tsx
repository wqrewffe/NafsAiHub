import React from 'react';
import ToolContainer from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { MegaphoneIcon } from './Icons';

interface DebateOutput {
    resolution: string;
    affirmativePoints: string[];
    negativePoints: string[];
}

export const renderDebateTopicGeneratorOutput = (output: DebateOutput | string) => {
    let data: DebateOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.resolution) {
        return <p className="text-red-400">Could not generate a debate topic. Please provide a clearer subject.</p>;
    }
    return (
        <div className="space-y-6">
             <div className="text-center">
                <MegaphoneIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Debate Topic</h2>
            </div>
            <div className="bg-secondary p-6 rounded-lg border border-slate-700">
                <p className="text-sm uppercase text-slate-400">Resolution</p>
                <h3 className="text-xl font-bold text-accent mt-1">{data.resolution}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-primary p-4 rounded-lg">
                    <h4 className="font-semibold text-green-400 mb-3">Affirmative (For)</h4>
                    <ul className="list-disc list-inside space-y-2 text-slate-300">
                        {data.affirmativePoints.map((point, i) => <li key={i}>{point}</li>)}
                    </ul>
                </div>
                 <div className="bg-primary p-4 rounded-lg">
                    <h4 className="font-semibold text-red-400 mb-3">Negative (Against)</h4>
                    <ul className="list-disc list-inside space-y-2 text-slate-300">
                        {data.negativePoints.map((point, i) => <li key={i}>{point}</li>)}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const DebateTopicGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'debate-topic-generator')!;

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            resolution: { type: GenAiType.STRING, description: "A formally worded debate resolution, starting with 'Resolved:'." },
            affirmativePoints: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "Three starting points for the 'For' side." },
            negativePoints: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "Three starting points for the 'Against' side." },
        },
        required: ["resolution", "affirmativePoints", "negativePoints"]
    };

    const handleGenerate = async ({ prompt }: { prompt: string; options: Record<string, any> }) => {
        const fullPrompt = `Create a high-quality, nuanced, and debatable topic based on the user's suggestion. Formulate it as a formal resolution (e.g., "Resolved: ..."). Then, provide three distinct starting points or key questions for both the Affirmative (For) and Negative (Against) sides to consider.

        Topic Suggestion: "${prompt}"`;
        return generateJson(fullPrompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            onGenerate={handleGenerate}
            renderOutput={renderDebateTopicGeneratorOutput}
        />
    );
};

export default DebateTopicGenerator;
