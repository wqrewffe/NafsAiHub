import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { ClipboardDocumentListIcon } from './Icons';

interface CaseOutput {
    caseTitle: string;
    vignette: {
        hpi: string;
        pmh: string;
        meds: string;
        social: string;
    };
    examination: {
        vitals: string;
        physical: string;
    };
    diagnostics: string[];
    assessmentAndPlan: {
        assessment: string;
        plan: string[];
    };
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
    <div className="mb-4">
        <h4 className="font-bold text-accent text-md border-b border-slate-600 pb-1 mb-2">{title}</h4>
        <div className="text-slate-300 text-sm space-y-1">{children}</div>
    </div>
);

export const renderClinicalCaseSimulatorOutput = (output: CaseOutput | string) => {
    let data: CaseOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.caseTitle || !data.vignette) {
        return <p className="text-red-400">Could not generate a case. Please be more specific about the type of case you want to see.</p>;
    }
    return (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <div className="text-center mb-6">
                <ClipboardDocumentListIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">{data.caseTitle}</h2>
                <p className="text-slate-400">Simulated Patient Encounter</p>
            </div>
            
            <div className="bg-primary p-4 rounded-md">
                <Section title="Patient History">
                    <p><strong>HPI:</strong> {data.vignette.hpi}</p>
                    <p><strong>PMH:</strong> {data.vignette.pmh}</p>
                    <p><strong>Medications:</strong> {data.vignette.meds}</p>
                    <p><strong>Social Hx:</strong> {data.vignette.social}</p>
                </Section>
                
                 <Section title="Examination">
                    <p><strong>Vitals:</strong> {data.examination.vitals}</p>
                    <p><strong>Physical Exam:</strong> {data.examination.physical}</p>
                </Section>

                 <Section title="Diagnostics">
                    <ul className="list-disc list-inside">
                        {data.diagnostics.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </Section>

                 <Section title="Assessment and Plan">
                    <p><strong>Assessment:</strong> {data.assessmentAndPlan.assessment}</p>
                    <p className="font-semibold mt-2">Plan:</p>
                    <ol className="list-decimal list-inside pl-4">
                        {data.assessmentAndPlan.plan.map((item, i) => <li key={i}>{item}</li>)}
                    </ol>
                </Section>
            </div>
        </div>
    );
};

const ClinicalCaseSimulator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'clinical-case-simulator')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'specialty',
            label: 'Medical Specialty',
            type: 'select',
            defaultValue: 'General Medicine',
            options: [
                { value: 'General Medicine', label: 'General Medicine' },
                { value: 'Cardiology', label: 'Cardiology' },
                { value: 'Neurology', label: 'Neurology' },
                { value: 'Gastroenterology', label: 'Gastroenterology' },
                { value: 'Pulmonology', label: 'Pulmonology' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            caseTitle: { type: GenAiType.STRING },
            vignette: {
                type: GenAiType.OBJECT,
                properties: {
                    hpi: { type: GenAiType.STRING, description: "History of Present Illness." },
                    pmh: { type: GenAiType.STRING, description: "Past Medical History." },
                    meds: { type: GenAiType.STRING, description: "Medications." },
                    social: { type: GenAiType.STRING, description: "Social History." },
                },
                required: ["hpi", "pmh", "meds", "social"]
            },
            examination: {
                 type: GenAiType.OBJECT,
                 properties: {
                    vitals: { type: GenAiType.STRING },
                    physical: { type: GenAiType.STRING, description: "Key physical exam findings." },
                 },
                 required: ["vitals", "physical"]
            },
            diagnostics: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "Key lab or imaging results." },
            assessmentAndPlan: {
                type: GenAiType.OBJECT,
                properties: {
                    assessment: { type: GenAiType.STRING, description: "A summary of the case and primary diagnosis." },
                    plan: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "A numbered list of management steps." }
                },
                required: ["assessment", "plan"]
            }
        },
        required: ["caseTitle", "vignette", "examination", "diagnostics", "assessmentAndPlan"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { language, specialty } = options;
        const fullPrompt = `Generate a realistic clinical case vignette from the specialty of '${specialty}' for a medical student to learn from, based on this request: "${prompt}". The case should be comprehensive, including a title, patient history (HPI, PMH, Meds, Social), physical exam findings (Vitals, Physical), key diagnostic results, and a "gold standard" Assessment and Plan section detailing the ideal management. The entire case must be written in ${language}.`;
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
            renderOutput={renderClinicalCaseSimulatorOutput}
        />
    );
};

export default ClinicalCaseSimulator;