
import React from 'react';
import ToolContainer from './common/ToolContainer';
import type { ToolOptionConfig } from '../types';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { BeakerIcon, BookOpenIcon, LightBulbIcon } from './Icons';
import { languageOptions } from './common/options';

interface MedicalTermOutput {
    term: string;
    simpleDefinition: string;
    analogy: string;
    etymology?: string;
}

export const renderMedicalTermDefinerOutput = (output: MedicalTermOutput | string) => {
    let data: MedicalTermOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.term || !data.simpleDefinition) {
        return <p className="text-red-400">The generated data is malformed. Please try again.</p>;
    }
    return (
        <div className="space-y-6 bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg">
            <div className="text-center border-b border-slate-700 pb-4">
                <BeakerIcon className="h-12 w-12 mx-auto text-accent" />
                <h2 className="mt-2 text-3xl font-bold text-light tracking-wide">{data.term}</h2>
            </div>
            <div className="space-y-4">
                <div className="p-4 bg-primary/50 rounded-lg">
                    <div className="flex items-center mb-2">
                       <BookOpenIcon className="h-6 w-6 text-sky-400 mr-3" />
                       <h3 className="font-semibold text-lg text-sky-400">Simple Definition</h3>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{data.simpleDefinition}</p>
                </div>
                {data.analogy && (
                    <div className="p-4 bg-primary/50 rounded-lg">
                         <div className="flex items-center mb-2">
                            <LightBulbIcon className="h-6 w-6 text-amber-400 mr-3" />
                            <h3 className="font-semibold text-lg text-amber-400">Helpful Analogy</h3>
                        </div>
                        <p className="text-slate-300 italic">"{data.analogy}"</p>
                    </div>
                )}
                 {data.etymology && (
                    <div className="p-4 bg-primary/50 rounded-lg">
                         <div className="flex items-center mb-2">
                            <BookOpenIcon className="h-6 w-6 text-emerald-400 mr-3" />
                            <h3 className="font-semibold text-lg text-emerald-400">Etymology</h3>
                        </div>
                        <p className="text-slate-300 text-sm">{data.etymology}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const MedicalTermDefiner: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'medical-term-definer')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'audience',
            label: 'Target Audience',
            type: 'select',
            defaultValue: 'Patient (Simple)',
            options: [
                { value: 'Patient (Simple)', label: 'Patient (Simple)' },
                { value: 'Medical Student (Technical)', label: 'Medical Student (Technical)' },
            ]
        },
        {
            name: 'includeEtymology',
            label: 'Include Etymology',
            type: 'select',
            defaultValue: 'No',
            options: [
                { value: 'Yes', label: 'Yes' },
                { value: 'No', label: 'No' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            term: { type: GenAiType.STRING, description: "The medical term that was defined." },
            simpleDefinition: { type: GenAiType.STRING, description: "A simple, easy-to-understand definition of the term (2-3 sentences)." },
            analogy: { type: GenAiType.STRING, description: "A helpful, one-sentence analogy to explain the term to a layperson." },
            etymology: { type: GenAiType.STRING, description: "The origin and root of the word. This property is optional." },
        },
        required: ['term', 'simpleDefinition', 'analogy'],
    };

    const handleGenerate = async ({ prompt: term, options }: { prompt: string; options: any; image?: { mimeType: string; data: string } }) => {
        const { audience, language, includeEtymology } = options;
        const etymologyInstruction = includeEtymology === 'Yes' ? "Also include the word's etymology." : "Do not include the word's etymology.";
        const prompt = `Provide a definition for the medical term: "${term}".
        The definition should be tailored for a "${audience}" audience.
        Provide the term itself, a simple definition, and a helpful analogy.
        ${etymologyInstruction}
        The entire response must be in ${language}.`;
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
            renderOutput={renderMedicalTermDefinerOutput}
        />
    );
};

export default MedicalTermDefiner;