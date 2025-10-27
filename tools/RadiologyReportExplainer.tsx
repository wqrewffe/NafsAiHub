import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { EyeIcon } from './Icons';

interface Finding {
    term: string;
    explanation: string;
}

interface ReportOutput {
    summary: string;
    findings: Finding[];
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

export const renderRadiologyReportExplainerOutput = (output: ReportOutput | string) => {
    let data: ReportOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.summary || !Array.isArray(data.findings)) {
        return <p className="text-red-400">Could not analyze the report. Please paste the full report text.</p>;
    }
    return (
        <div className="space-y-6">
            <div className="text-center">
                <EyeIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Radiology Report Simplified</h2>
            </div>

            <div className="bg-secondary p-4 rounded-lg">
                <h3 className="font-bold text-lg text-light mb-2">Key Findings Summary</h3>
                <p className="text-slate-300 italic">"{data.summary}"</p>
            </div>

            <div>
                <h3 className="font-bold text-lg text-light mb-3">Terminology Explained</h3>
                <div className="border border-slate-700 rounded-md overflow-hidden">
                    <table className="w-full divide-y divide-slate-700">
                         <thead className="bg-slate-800">
                            <tr>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider w-1/3">Technical Term</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Plain English Explanation</th>
                            </tr>
                        </thead>
                         <tbody className="bg-primary divide-y divide-slate-700">
                            {data.findings.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-3 font-semibold text-accent/90 align-top">{item.term}</td>
                                    <td className="px-4 py-3 text-slate-300 leading-relaxed">{item.explanation}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const RadiologyReportExplainer: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'radiology-report-explainer')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'modality',
            label: 'Imaging Modality',
            type: 'select',
            defaultValue: 'CT Scan',
            options: [
                { value: 'X-ray', label: 'X-ray' },
                { value: 'CT Scan', label: 'CT Scan' },
                { value: 'MRI', label: 'MRI' },
                { value: 'Ultrasound', label: 'Ultrasound' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            summary: { type: GenAiType.STRING, description: "A one or two-sentence summary of the main finding of the report." },
            findings: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        term: { type: GenAiType.STRING, description: "The technical medical term from the report." },
                        explanation: { type: GenAiType.STRING, description: "The plain English explanation of the term." }
                    },
                    required: ["term", "explanation"]
                },
                description: "A list of key terms and their simple explanations."
            }
        },
        required: ["summary", "findings"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { language, modality } = options;
        const fullPrompt = `Act as a radiologist explaining a report to a junior medical student. Analyze the following radiology report from a(n) '${modality}'. Provide a one-sentence summary of the most important finding. Then, identify key technical terms and provide a simple, plain language explanation for each. The entire response must be in ${language}.

        Report: "${prompt}"`;
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
            renderOutput={renderRadiologyReportExplainerOutput}
        />
    );
};

export default RadiologyReportExplainer;