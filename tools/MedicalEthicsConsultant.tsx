import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { ChatBubbleLeftEllipsisIcon } from './Icons';

interface Viewpoint {
    principle: 'Autonomy' | 'Beneficence' | 'Non-maleficence' | 'Justice';
    discussion: string;
}

interface EthicsOutput {
    dilemma: string;
    analysis: Viewpoint[];
    suggestedAction?: string;
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

export const renderMedicalEthicsConsultantOutput = (output: EthicsOutput | string) => {
    let data: EthicsOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.analysis) || data.analysis.length < 4) {
        return <p className="text-red-400">Could not analyze the dilemma. Please provide a clearer ethical scenario.</p>;
    }
    
    const getPrincipleData = (principle: string) => {
        return data.analysis.find(a => a.principle === principle) || { discussion: "N/A" };
    };

    const principles = ['Autonomy', 'Beneficence', 'Non-maleficence', 'Justice'];

    return (
        <div className="space-y-6">
            <div className="text-center">
                <ChatBubbleLeftEllipsisIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Ethical Consultation</h2>
                <p className="text-slate-400 mt-1">Dilemma: <span className="italic">"{data.dilemma}"</span></p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {principles.map(p => (
                    <div key={p} className="bg-secondary p-4 rounded-lg border border-slate-700">
                        <h3 className="text-xl font-bold text-accent">{p}</h3>
                        <p className="text-slate-300 mt-2">{getPrincipleData(p).discussion}</p>
                    </div>
                ))}
            </div>

            {data.suggestedAction && (
                <div className="bg-secondary p-4 rounded-lg">
                    <h3 className="font-bold text-lg text-light mb-2">Suggested Course of Action</h3>
                    <p className="text-slate-300">{data.suggestedAction}</p>
                </div>
            )}
        </div>
    );
};

const MedicalEthicsConsultant: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'medical-ethics-consultant')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'includeAction',
            label: 'Suggest Action',
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
            dilemma: { type: GenAiType.STRING, description: "A summary of the ethical dilemma." },
            analysis: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        principle: { type: GenAiType.STRING, enum: ['Autonomy', 'Beneficence', 'Non-maleficence', 'Justice'] },
                        discussion: { type: GenAiType.STRING, description: "A discussion of the dilemma from this principle's viewpoint." }
                    },
                    required: ["principle", "discussion"]
                },
                description: "An array of 4 analyses, one for each of the four pillars of medical ethics."
            },
            suggestedAction: { type: GenAiType.STRING, description: "Optional suggested course of action based on the analysis."}
        },
        required: ["dilemma", "analysis"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { language, includeAction } = options;
        const actionInstruction = includeAction === 'Yes' ? 'Finally, based on the analysis, provide a suggested course of action.' : '';
        const fullPrompt = `Analyze the following medical ethical dilemma. Summarize the dilemma, then provide a brief analysis from the perspective of each of the four pillars of medical ethics: Autonomy, Beneficence, Non-maleficence, and Justice. ${actionInstruction} The entire response must be in ${language}.

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
            renderOutput={renderMedicalEthicsConsultantOutput}
        />
    );
};

export default MedicalEthicsConsultant;