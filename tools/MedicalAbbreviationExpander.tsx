
import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { Bars3BottomLeftIcon } from './Icons';

interface Abbreviation {
    abbr: string;
    fullName: string;
    context: string;
}

interface AbbrOutput {
    abbreviations: Abbreviation[];
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
    ]
};

export const renderMedicalAbbreviationExpanderOutput = (output: AbbrOutput | string) => {
    let data: AbbrOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.abbreviations) || data.abbreviations.length === 0) {
        return <p className="text-red-400">Could not expand abbreviations. Please list them clearly, separated by commas or spaces.</p>;
    }
    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <Bars3BottomLeftIcon className="h-8 w-8 text-accent"/>
                <h2 className="text-2xl font-bold text-light">Abbreviation Expander</h2>
            </div>
             <div className="border border-slate-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-secondary">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider w-1/6">Abbr.</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Full Name</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Context</th>
                            </tr>
                        </thead>
                        <tbody className="bg-primary divide-y divide-slate-700">
                            {data.abbreviations.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-4 font-bold text-accent whitespace-nowrap">{item.abbr}</td>
                                    <td className="px-4 py-4 text-slate-300">{item.fullName}</td>
                                    <td className="px-4 py-4 text-slate-400 text-sm">{item.context}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const MedicalAbbreviationExpander: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'medical-abbreviation-expander')!;

    const optionsConfig: ToolOptionConfig[] = [
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            abbreviations: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        abbr: { type: GenAiType.STRING, description: "The abbreviation (e.g., 'SOB')." },
                        fullName: { type: GenAiType.STRING, description: "The full, expanded term (e.g., 'Shortness of Breath')." },
                        context: { type: GenAiType.STRING, description: "A brief explanation of how it's used." }
                    },
                    required: ["abbr", "fullName", "context"]
                }
            }
        },
        required: ["abbreviations"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { language } = options;
        const fullPrompt = `For each medical abbreviation in the following list, provide the abbreviation itself, its full name, and a brief context for its use. The full name and context must be in ${language}.

        Abbreviations: "${prompt}"`;
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
            renderOutput={renderMedicalAbbreviationExpanderOutput}
        />
    );
};

export default MedicalAbbreviationExpander;
