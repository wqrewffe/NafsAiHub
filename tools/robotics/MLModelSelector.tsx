import React from 'react';
import ToolContainer from '../common/ToolContainer';
import { generateJson, GenAiType } from '../../services/geminiService';
import { tools } from '../index';
import { FunnelIcon, CheckCircleIcon, XCircleIcon } from '../Icons';

interface ModelRecommendation {
    model: string;
    reason: string;
    pros: string[];
    cons: string[];
}

interface MLModelOutput {
    task: string;
    recommendations: ModelRecommendation[];
}

export const renderMLModelSelectorOutput = (output: MLModelOutput | string) => {
    let data: MLModelOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.recommendations) || data.recommendations.length === 0) {
        return <p className="text-red-400">Could not recommend a model. Please describe your task and data more clearly.</p>;
    }

    const topPick = data.recommendations[0];
    const others = data.recommendations.slice(1);

    return (
        <div className="space-y-6">
            <div className="text-center">
                <FunnelIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Model Recommendations</h2>
                 <p className="text-slate-400">For Task: <span className="italic">"{data.task}"</span></p>
            </div>
            
            <div className="bg-secondary p-4 rounded-lg border-t-4 border-accent">
                <p className="text-sm font-bold text-accent uppercase">Top Recommendation</p>
                <h3 className="text-2xl font-bold text-light">{topPick.model}</h3>
                <p className="text-slate-300 mt-2 text-sm">{topPick.reason}</p>
                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-600">
                    <div>
                        <h4 className="font-semibold text-green-400">Pros</h4>
                        <ul className="list-disc list-inside text-slate-400 text-xs">
                            {topPick.pros.map((p,i) => <li key={i}>{p}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-red-400">Cons</h4>
                         <ul className="list-disc list-inside text-slate-400 text-xs">
                            {topPick.cons.map((c,i) => <li key={i}>{c}</li>)}
                        </ul>
                    </div>
                </div>
            </div>

            {others.length > 0 && (
                <div>
                    <h3 className="font-bold text-lg text-light">Also Consider</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                         {others.map((other, index) => (
                            <div key={index} className="bg-secondary p-4 rounded-lg">
                                <h3 className="text-xl font-bold text-light">{other.model}</h3>
                                 <p className="text-slate-300 mt-1 text-sm">{other.reason}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const MLModelSelector: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'ml-model-selector')!;

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            task: { type: GenAiType.STRING, description: "A summary of the user's task." },
            recommendations: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        model: { type: GenAiType.STRING, description: "e.g., 'Random Forest Classifier'" },
                        reason: { type: GenAiType.STRING },
                        pros: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING } },
                        cons: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING } }
                    },
                    required: ["model", "reason", "pros", "cons"]
                },
                description: "An array of 2-3 model recommendations, with the best one first."
            }
        },
        required: ["task", "recommendations"]
    };

    const handleGenerate = async ({ prompt }: { prompt: string; options: any }) => {
        const fullPrompt = `Based on the following description of a machine learning task and dataset, recommend the best ML model to use. Provide a ranked list of 2-3 models. For the top recommendation, explain why it's a good fit and list its pros and cons. For the others, just give a brief reason.

        Task Description: "${prompt}"`;
        return generateJson(fullPrompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            onGenerate={handleGenerate}
            renderOutput={renderMLModelSelectorOutput}
        />
    );
};

export default MLModelSelector;
