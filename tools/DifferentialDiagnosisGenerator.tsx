import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { StethoscopeIcon } from './Icons';

interface Diagnosis {
    diagnosis: string;
    likelihood: 'High' | 'Medium' | 'Low';
    keyFeatures: string[];
}

interface DdxOutput {
    chiefComplaint: string;
    diagnoses: Diagnosis[];
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

export const renderDifferentialDiagnosisGeneratorOutput = (output: DdxOutput | string) => {
    let data: DdxOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    const getLikelihoodClass = (likelihood: string) => {
        switch (likelihood) {
            case 'High': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'Low': return 'bg-green-500/20 text-green-400 border-green-500/30';
            default: return 'bg-slate-700';
        }
    };

    if (!data || !Array.isArray(data.diagnoses) || data.diagnoses.length === 0) {
        return <p className="text-red-400">Could not generate a differential diagnosis. Please provide a clearer clinical picture.</p>;
    }
    return (
        <div className="space-y-6">
            <div className="text-center">
                <StethoscopeIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Differential Diagnosis for: <span className="text-accent">{data.chiefComplaint}</span></h2>
            </div>
            <div className="space-y-4">
                {data.diagnoses.map((item, index) => (
                    <div key={index} className={`bg-secondary p-4 rounded-lg border-l-4 ${getLikelihoodClass(item.likelihood)}`}>
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-light">{index + 1}. {item.diagnosis}</h3>
                            <span className={`text-xs font-bold py-1 px-3 rounded-full ${getLikelihoodClass(item.likelihood)}`}>{item.likelihood} Likelihood</span>
                        </div>
                        <div className="mt-3">
                            <p className="text-sm font-semibold text-slate-300 mb-1">Key Differentiating Features:</p>
                            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-400">
                                {item.keyFeatures.map((feature, i) => <li key={i}>{feature}</li>)}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
             <p className="text-xs text-slate-500 text-center mt-6">Disclaimer: This tool is for educational purposes only and is not a substitute for professional medical advice.</p>
        </div>
    );
};

const DifferentialDiagnosisGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'differential-diagnosis-generator')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'numDiagnoses',
            label: 'Number of Diagnoses',
            type: 'number',
            defaultValue: 4,
            min: 2,
            max: 7,
        },
        {
            name: 'urgency',
            label: 'Assumed Urgency',
            type: 'select',
            defaultValue: 'Urgent',
            options: [
                { value: 'Emergency', label: 'Emergency (Life-threatening)' },
                { value: 'Urgent', label: 'Urgent' },
                { value: 'Non-Urgent', label: 'Non-Urgent' },
            ]
        },
        languageOptions,
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            chiefComplaint: { type: GenAiType.STRING, description: "The primary symptom or complaint." },
            diagnoses: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        diagnosis: { type: GenAiType.STRING },
                        likelihood: { type: GenAiType.STRING, enum: ["High", "Medium", "Low"] },
                        keyFeatures: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "Clinical features that support this diagnosis." }
                    },
                    required: ["diagnosis", "likelihood", "keyFeatures"]
                },
                description: "An array of possible diagnoses, ranked from most to least likely."
            }
        },
        required: ["chiefComplaint", "diagnoses"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { numDiagnoses, urgency, language } = options;
        const fullPrompt = `Act as a clinical decision support tool. Based on the following patient presentation, and assuming a clinical context of '${urgency}', generate a differential diagnosis. Identify the chief complaint and provide a list of ${numDiagnoses} potential diagnoses, ranked from most to least likely. For each diagnosis, specify its likelihood ('High', 'Medium', or 'Low') and list the key supporting clinical features. The response must be in ${language}.

        Patient Presentation: "${prompt}"`;
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
            renderOutput={renderDifferentialDiagnosisGeneratorOutput}
        />
    );
};

export default DifferentialDiagnosisGenerator;