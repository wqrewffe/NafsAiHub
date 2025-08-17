import React from 'react';
import ToolContainer from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { CubeTransparentIcon } from './Icons';

interface WhatIfScienceExplainerOutput {
    scenario: string;
    immediateEffects: string[];
    longTermConsequences: string[];
    conclusion: string;
}

export const renderWhatIfScienceExplainerOutput = (output: WhatIfScienceExplainerOutput | string) => {
    let data: WhatIfScienceExplainerOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.scenario || !Array.isArray(data.immediateEffects)) {
        return <p className="text-red-400">Could not explain this scenario. Please try a different question.</p>;
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <CubeTransparentIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">What If... <span className="text-accent">{data.scenario}?</span></h2>
            </div>

            <div className="bg-secondary p-4 rounded-lg">
                <h3 className="font-semibold text-lg text-light mb-3">Immediate Effects</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-300">
                    {data.immediateEffects.map((effect, i) => <li key={i}>{effect}</li>)}
                </ul>
            </div>

            <div className="bg-secondary p-4 rounded-lg">
                <h3 className="font-semibold text-lg text-light mb-3">Long-Term Consequences</h3>
                 <ul className="list-disc list-inside space-y-2 text-slate-300">
                    {data.longTermConsequences.map((consequence, i) => <li key={i}>{consequence}</li>)}
                </ul>
            </div>

            <div className="bg-primary p-4 rounded-lg border-l-4 border-accent">
                <h3 className="font-semibold text-lg text-accent mb-2">Conclusion</h3>
                <p className="text-slate-300 italic">{data.conclusion}</p>
            </div>
        </div>
    );
};

const WhatIfScienceExplainer: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'what-if-science-explainer')!;

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            scenario: { type: GenAiType.STRING },
            immediateEffects: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING } },
            longTermConsequences: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING } },
            conclusion: { type: GenAiType.STRING, description: "A summary of the final outcome." }
        },
        required: ["scenario", "immediateEffects", "longTermConsequences", "conclusion"]
    };

    const handleGenerate = async ({ prompt }: { prompt: string; options: any }) => {
        const fullPrompt = `Explore the hypothetical scientific scenario: "${prompt}". Based on known scientific principles, explain the likely immediate effects (within the first hours/days) and the long-term consequences. Provide each as a list of bullet points. Conclude with a summary of the ultimate outcome.`;
        return generateJson(fullPrompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            onGenerate={handleGenerate}
            renderOutput={renderWhatIfScienceExplainerOutput}
        />
    );
};

export default WhatIfScienceExplainer;
