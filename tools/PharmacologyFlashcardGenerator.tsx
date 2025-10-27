import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { PillIcon } from './Icons';

interface FlashcardOutput {
    drugName: string;
    drugClass: string;
    mechanismOfAction: string;
    commonSideEffects: string[];
    keyContraindications: string[];
    additionalInfo?: string;
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

const Section: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <div className="border-t border-slate-600 pt-3 mt-3">
        <h4 className="font-bold text-accent text-sm uppercase tracking-wider">{title}</h4>
        <div className="text-slate-300 mt-1 text-sm">{children}</div>
    </div>
);

export const renderPharmacologyFlashcardGeneratorOutput = (output: FlashcardOutput | string) => {
    let data: FlashcardOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.drugName || !data.mechanismOfAction) {
        return <p className="text-red-400">Could not generate a flashcard. Please check the drug name.</p>;
    }
    return (
        <div className="max-w-md mx-auto">
            <div className="bg-secondary p-6 rounded-lg border border-slate-700 shadow-2xl">
                <div className="text-center">
                     <PillIcon className="h-8 w-8 mx-auto text-accent mb-2" />
                    <h2 className="text-3xl font-bold text-light capitalize">{data.drugName}</h2>
                    <p className="text-slate-400 font-medium">{data.drugClass}</p>
                </div>

                <Section title="Mechanism of Action">
                    <p>{data.mechanismOfAction}</p>
                </Section>

                <Section title="Common Side Effects">
                    <ul className="list-disc list-inside">
                       {data.commonSideEffects.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </Section>

                 <Section title="Key Contraindications">
                    <ul className="list-disc list-inside">
                       {data.keyContraindications.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </Section>

                {data.additionalInfo && (
                    <Section title="Clinical Pearl / Counseling Point">
                        <p>{data.additionalInfo}</p>
                    </Section>
                )}
            </div>
        </div>
    );
};

const PharmacologyFlashcardGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'pharmacology-flashcard-generator')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'include',
            label: 'Include Section',
            type: 'select',
            defaultValue: 'None',
            options: [
                { value: 'None', label: 'None' },
                { value: 'Clinical Pearls', label: 'Clinical Pearls' },
                { value: 'Patient Counseling Points', label: 'Patient Counseling Points' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            drugName: { type: GenAiType.STRING },
            drugClass: { type: GenAiType.STRING },
            mechanismOfAction: { type: GenAiType.STRING, description: "A clear and concise explanation of the MOA." },
            commonSideEffects: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING } },
            keyContraindications: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING } },
            additionalInfo: { type: GenAiType.STRING, description: "Optional: A clinical pearl or patient counseling point."}
        },
        required: ["drugName", "drugClass", "mechanismOfAction", "commonSideEffects", "keyContraindications"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { language, include } = options;
        const includeInstruction = include !== 'None' ? `In addition, please include a section for '${include}'.` : '';
        const fullPrompt = `Generate a pharmacology flashcard for the following drug. Provide the drug's name, its class, mechanism of action, a list of 3-5 common side effects, and a list of key contraindications. ${includeInstruction} The entire response must be in ${language}, but keep the drug name in its original form.

        Drug: "${prompt}"`;
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
            renderOutput={renderPharmacologyFlashcardGeneratorOutput}
        />
    );
};

export default PharmacologyFlashcardGenerator;