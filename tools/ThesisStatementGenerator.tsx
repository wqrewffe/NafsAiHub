
import React, { useState } from 'react';
import ToolContainer from './common/ToolContainer';
import type { ToolOptionConfig } from '../types';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { ClipboardDocumentIcon, CheckCircleIcon } from './Icons';
import { languageOptions } from './common/options';

interface ThesisOption {
    statement: string;
    type: string;
    rationale: string;
}

interface ThesisOutput {
    theses: ThesisOption[];
}

export const renderThesisStatementGeneratorOutput = (output: ThesisOutput | string) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    
    let data: ThesisOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    if (!data || !Array.isArray(data.theses) || data.theses.length === 0) {
        return <p className="text-red-400">Could not generate thesis statements. Please try again.</p>;
    }
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold text-light">Here are a few strong options:</h3>
            {data.theses.map((thesis, index) => (
                <div key={index} className="bg-primary/50 p-4 rounded-lg border border-slate-700 transition-shadow hover:shadow-lg hover:border-accent/50">
                    <div className="flex justify-between items-start gap-4">
                       <blockquote className="border-l-4 border-accent pl-4 flex-grow">
                            <p className="italic text-lg text-slate-200">{thesis.statement}</p>
                       </blockquote>
                       <button 
                            onClick={() => handleCopy(thesis.statement, index)}
                            className="flex-shrink-0 bg-slate-700 hover:bg-accent text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:bg-green-600 flex items-center gap-1.5"
                            disabled={copiedIndex === index}
                        >
                            {copiedIndex === index 
                                ? <><CheckCircleIcon className="h-4 w-4" /> Copied!</>
                                : <><ClipboardDocumentIcon className="h-4 w-4" /> Copy</>
                            }
                        </button>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-700">
                         <span className="text-xs font-semibold inline-block py-1 px-2.5 uppercase rounded-full text-sky-300 bg-sky-800/50 mr-2">
                            {thesis.type}
                        </span>
                         <p className="text-sm text-slate-400 mt-2">{thesis.rationale}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ThesisStatementGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'thesis-statement-generator')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'thesisType',
            label: 'Thesis Type',
            type: 'select',
            defaultValue: 'Any',
            options: [
                { value: 'Any', label: 'Any' },
                { value: 'Argumentative', label: 'Argumentative' },
                { value: 'Analytical', label: 'Analytical' },
                { value: 'Expository', label: 'Expository' },
            ]
        },
        {
            name: 'tone',
            label: 'Tone',
            type: 'select',
            defaultValue: 'Confident',
            options: [
                { value: 'Confident', label: 'Confident' },
                { value: 'Nuanced', label: 'Nuanced' },
                { value: 'Provocative', label: 'Provocative' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            theses: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        statement: { type: GenAiType.STRING },
                        type: { type: GenAiType.STRING, description: "The type of thesis (e.g., 'Argumentative', 'Analytical', 'Expository')." },
                        rationale: { type: GenAiType.STRING, description: "A brief (1-sentence) explanation of why this is a strong thesis statement." },
                    },
                    required: ["statement", "type", "rationale"]
                },
                description: "An array of 3 distinct, strong, and arguable thesis statements with analysis."
            }
        },
        required: ['theses']
    };

    const handleGenerate = async ({ prompt: topic, options }: { prompt: string; options: any; image?: { mimeType: string; data: string } }) => {
        const { thesisType, language, tone } = options;
        const typeInstruction = thesisType === 'Any' ? '' : ` The statements should be of the "${thesisType}" type.`;
        const prompt = `Generate 3 strong, clear, and arguable thesis statement variations based on the following information: "${topic}". The statements should have a '${tone}' tone. For each thesis, provide the statement, its type, and a one-sentence rationale for its effectiveness.${typeInstruction} Each thesis statement itself should be a single, concise sentence. The entire response must be in ${language}.`;
        return generateJson(prompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            optionsConfig={optionsConfig}
            onGenerate={handleGenerate}
            renderOutput={renderThesisStatementGeneratorOutput}
        />
    );
};

export default ThesisStatementGenerator;