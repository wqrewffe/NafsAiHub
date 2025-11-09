import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { ScissorsIcon } from './Icons';

interface ProcedureStep {
    phase: string;
    description: string;
}

interface ProcedureOutput {
    procedureName: string;
    steps: ProcedureStep[];
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

export const renderSurgicalProcedureOutlinerOutput = (output: ProcedureOutput | string) => {
    let data: ProcedureOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.procedureName || !Array.isArray(data.steps)) {
        return <p className="text-red-400">Could not generate a procedure outline. Please check the procedure name.</p>;
    }
    
    // Group steps by phase
    const groupedSteps = data.steps.reduce((acc, step) => {
        (acc[step.phase] = acc[step.phase] || []).push(step.description);
        return acc;
    }, {} as Record<string, string[]>);
    
    const phases = Object.keys(groupedSteps);

    return (
        <div className="space-y-6">
            <div className="text-center">
                <ScissorsIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Surgical Outline: <span className="text-accent">{data.procedureName}</span></h2>
            </div>
            
            <div className="border border-slate-700 rounded-lg p-4 bg-primary/50">
                {phases.map((phase, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                        <h3 className="font-bold text-lg text-accent mb-2">{phase}</h3>
                        <ul className="space-y-2">
                            {groupedSteps[phase].map((desc, i) => (
                                <li key={i} className="flex items-start p-2 bg-secondary rounded-md">
                                    <svg className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-slate-300">{desc}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
             <p className="text-xs text-slate-500 text-center mt-6">Disclaimer: This simplified outline is for educational overview only and is not a surgical guide.</p>
        </div>
    );
};

const SurgicalProcedureOutliner: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'surgical-procedure-outliner')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'detailLevel',
            label: 'Detail Level',
            type: 'select',
            defaultValue: 'High-Level Overview',
            options: [
                { value: 'High-Level Overview', label: 'High-Level Overview' },
                { value: 'Detailed Steps', label: 'Detailed Steps' },
            ]
        },
        {
            name: 'focusOn',
            label: 'Focus On',
            type: 'select',
            defaultValue: 'Key Steps',
            options: [
                { value: 'Key Steps', label: 'Key Steps' },
                { value: 'Potential Complications', label: 'Potential Complications' },
                { value: 'Anatomy', label: 'Relevant Anatomy' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            procedureName: { type: GenAiType.STRING },
            steps: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        phase: { type: GenAiType.STRING, description: "The phase of the surgery (e.g., 'Pre-operative', 'Incision', 'Exposure', 'Main Procedure', 'Closure')." },
                        description: { type: GenAiType.STRING, description: "A brief description of the step." }
                    },
                    required: ["phase", "description"]
                },
                description: "A list of high-level steps, grouped by phase."
            }
        },
        required: ["procedureName", "steps"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { detailLevel, language, focusOn } = options;
        const fullPrompt = `Provide a ${detailLevel} step-by-step outline of the following surgical procedure, with a special focus on the '${focusOn}'. Group the steps into logical phases (e.g., Pre-operative, Incision, Exposure, Main Procedure, Closure). This is for a medical student's general understanding, not for actual surgical use. The entire response must be in ${language}.

        Procedure: "${prompt}"`;
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
            renderOutput={renderSurgicalProcedureOutlinerOutput}
        />
    );
};

export default SurgicalProcedureOutliner;