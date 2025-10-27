
import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { ShieldCheckIcon } from './Icons';

interface Viewpoint {
    framework: string;
    analysis: string;
    conclusion: string;
}

interface DilemmaOutput {
    dilemma: string;
    viewpoints: Viewpoint[];
    additionalAnalysis?: {
        title: string;
        points: string[];
    }
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
        { value: 'Mandarin Chinese', label: 'Mandarin Chinese' },
        { value: 'Hindi', label: 'Hindi' },
        { value: 'Arabic', label: 'Arabic' },
        { value: 'Portuguese', label: 'Portuguese' },
        { value: 'Bengali', label: 'Bengali (Bangla)' },
        { value: 'Russian', label: 'Russian' },
    ]
};

export const renderEthicalDilemmaExplorerOutput = (output: DilemmaOutput | string) => {
    let data: DilemmaOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.viewpoints) || data.viewpoints.length === 0) {
        return <p className="text-red-400">Could not analyze the dilemma. Please provide a clearer scenario.</p>;
    }
    return (
        <div className="space-y-6">
            <div className="text-center">
                <ShieldCheckIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Ethical Analysis: <span className="text-accent">{data.dilemma}</span></h2>
            </div>
            <div className="border border-slate-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-secondary">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider w-1/5">Framework</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Analysis & Conclusion</th>
                            </tr>
                        </thead>
                        <tbody className="bg-primary divide-y divide-slate-700">
                            {data.viewpoints.map((view, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-4 align-top">
                                        <span className="font-bold text-accent">{view.framework}</span>
                                    </td>
                                    <td className="px-4 py-4 align-top text-slate-300 space-y-2">
                                        <p>{view.analysis}</p>
                                        <p className="text-sm text-sky-400/80"><strong className="font-semibold">Conclusion:</strong> {view.conclusion}</p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {data.additionalAnalysis && (
                 <div className="bg-secondary p-4 rounded-lg">
                    <h3 className="font-bold text-lg text-light mb-3">{data.additionalAnalysis.title}</h3>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                       {data.additionalAnalysis.points.map((point, i) => <li key={i}>{point}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
};

const EthicalDilemmaExplorer: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'ethical-dilemma-explorer')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'include',
            label: 'Additionally Analyze',
            type: 'select',
            defaultValue: 'None',
            options: [
                { value: 'None', label: 'None' },
                { value: 'Key Stakeholders', label: 'Key Stakeholders' },
                { value: 'Potential Consequences', label: 'Potential Consequences' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            dilemma: { type: GenAiType.STRING, description: "A summary of the ethical dilemma." },
            viewpoints: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        framework: { type: GenAiType.STRING, description: "The name of the ethical framework (e.g., 'Utilitarianism', 'Deontology', 'Virtue Ethics')." },
                        analysis: { type: GenAiType.STRING, description: "How this framework would analyze the situation." },
                        conclusion: { type: GenAiType.STRING, description: "The likely course of action or conclusion from this framework's perspective." }
                    },
                    required: ["framework", "analysis", "conclusion"]
                },
                description: "An array of 3 analyses from different ethical frameworks."
            },
            additionalAnalysis: {
                type: GenAiType.OBJECT,
                properties: {
                    title: { type: GenAiType.STRING },
                    points: { type: GenAiType.ARRAY, items: {type: GenAiType.STRING }}
                },
                description: "Optional analysis of stakeholders or consequences."
            }
        },
        required: ["dilemma", "viewpoints"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { language, include } = options;
        const includeInstruction = include !== 'None' ? `In addition, provide a brief analysis of the '${include}'.` : '';
        const fullPrompt = `Analyze the following ethical dilemma from three different major philosophical frameworks: Utilitarianism, Deontology, and Virtue Ethics. For each framework, provide its name, a brief analysis of the dilemma, and its likely conclusion. ${includeInstruction} The entire response must be in ${language}.

        Dilemma: "${prompt}"`;
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
            renderOutput={renderEthicalDilemmaExplorerOutput}
        />
    );
};

export default EthicalDilemmaExplorer;
