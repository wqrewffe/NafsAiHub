import React from 'react';
import ToolContainer from '../common/ToolContainer';
import { generateJson, GenAiType } from '../../services/geminiService';
import { tools } from '../index';
import { AcademicCapIcon } from '../Icons';

interface AlgorithmOutput {
    algorithm: string;
    gist: string;
    analogy: string;
    details: string[];
}

export const renderAlgorithmExplainerOutput = (output: AlgorithmOutput | string) => {
    let data: AlgorithmOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.algorithm || !data.gist) {
        return <p className="text-red-400">Could not explain this algorithm. Please be more specific.</p>;
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <AcademicCapIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Understanding: <span className="text-accent">{data.algorithm}</span></h2>
            </div>
            <div className="bg-secondary p-4 rounded-lg">
                <h3 className="font-bold text-lg text-light">The Gist (ELI5)</h3>
                <p className="text-slate-300 mt-1">{data.gist}</p>
            </div>
            <div className="bg-secondary p-4 rounded-lg">
                <h3 className="font-bold text-lg text-light">The Analogy</h3>
                <p className="text-slate-300 mt-1 italic">"{data.analogy}"</p>
            </div>
             <div className="bg-secondary p-4 rounded-lg">
                <h3 className="font-bold text-lg text-light">The Details</h3>
                <ul className="list-disc list-inside space-y-1 mt-2 text-slate-300">
                    {data.details.map((detail, i) => <li key={i}>{detail}</li>)}
                </ul>
            </div>
        </div>
    );
};

const AlgorithmExplainer: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'algorithm-explainer')!;

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            algorithm: { type: GenAiType.STRING },
            gist: { type: GenAiType.STRING, description: "A very simple, one-sentence explanation." },
            analogy: { type: GenAiType.STRING, description: "A relatable, real-world analogy." },
            details: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "A list of 3-4 bullet points with slightly more technical details." }
        },
        required: ["algorithm", "gist", "analogy", "details"]
    };

    const handleGenerate = async ({ prompt }: { prompt: string; options: any }) => {
        const fullPrompt = `Explain the following AI/ML algorithm: "${prompt}". Provide the name of the algorithm, a one-sentence "gist" explaining it like I'm five, a helpful real-world analogy, and a few bullet points with more technical details.`;
        return generateJson(fullPrompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            onGenerate={handleGenerate}
            renderOutput={renderAlgorithmExplainerOutput}
        />
    );
};

export default AlgorithmExplainer;
