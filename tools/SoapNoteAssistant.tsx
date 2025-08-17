import React, { useState } from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { DocumentDuplicateIcon, ClipboardDocumentIcon, CheckCircleIcon } from './Icons';

interface SoapNote {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
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

const Section: React.FC<{title: string; letter: string; children: React.ReactNode}> = ({ title, letter, children }) => (
    <div>
        <h3 className="flex items-center text-xl font-bold text-light">
            <span className="text-2xl font-black text-accent w-8">{letter}:</span>
            <span>{title}</span>
        </h3>
        <div className="pl-8 pt-1 text-slate-300">{children}</div>
    </div>
);

export const renderSoapNoteAssistantOutput = (output: SoapNote | string) => {
    const [copied, setCopied] = useState(false);
    
    let data: SoapNote;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    const handleCopy = (note: SoapNote) => {
        const noteText = `S: ${note.subjective}\n\nO: ${note.objective}\n\nA: ${note.assessment}\n\nP: ${note.plan}`;
        navigator.clipboard.writeText(noteText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!data || !data.subjective || !data.assessment) {
        return <p className="text-red-400">Could not generate a SOAP note. Please provide more clinical details.</p>;
    }
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <DocumentDuplicateIcon className="h-8 w-8 text-accent"/>
                    <h2 className="text-2xl font-bold text-light">SOAP Note</h2>
                </div>
                 <button 
                    onClick={() => handleCopy(data)}
                    disabled={copied}
                    className="flex items-center gap-2 text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-md transition-colors disabled:bg-green-800/50 disabled:text-green-400"
                >
                    {copied ? <CheckCircleIcon className="h-5 w-5" /> : <ClipboardDocumentIcon className="h-5 w-5" />}
                    {copied ? 'Copied!' : 'Copy Note'}
                </button>
            </div>
            <div className="bg-primary/50 p-4 rounded-lg border border-slate-700 space-y-4">
                <Section title="Subjective" letter="S">
                    <p>{data.subjective}</p>
                </Section>
                <Section title="Objective" letter="O">
                    <p>{data.objective}</p>
                </Section>
                <Section title="Assessment" letter="A">
                    <p>{data.assessment}</p>
                </Section>
                <Section title="Plan" letter="P">
                    <p className="whitespace-pre-wrap">{data.plan}</p>
                </Section>
            </div>
            <p className="text-xs text-slate-500 text-center mt-6">Disclaimer: This tool is for educational purposes only and is not a substitute for professional medical advice.</p>
        </div>
    );
};

const SoapNoteAssistant: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'soap-note-assistant')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'format',
            label: 'Plan Format',
            type: 'select',
            defaultValue: 'Standard',
            options: [
                { value: 'Standard', label: 'Standard Text' },
                { value: 'Bulleted Plan', label: 'Bulleted List' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            subjective: { type: GenAiType.STRING, description: "The patient's subjective complaints and history." },
            objective: { type: GenAiType.STRING, description: "Objective findings from vitals and physical exam." },
            assessment: { type: GenAiType.STRING, description: "A one-sentence summary assessment, including the primary diagnosis." },
            plan: { type: GenAiType.STRING, description: "The plan, formatted as requested (standard text or bulleted list)." }
        },
        required: ["subjective", "objective", "assessment", "plan"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { language, format } = options;
        const fullPrompt = `Based on the following clinical information, generate a concise and professionally formatted SOAP note. The Plan section should be formatted as '${format}'. The entire note must be in ${language}.

        Clinical Info: "${prompt}"`;
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
            renderOutput={renderSoapNoteAssistantOutput}
        />
    );
};

export default SoapNoteAssistant;