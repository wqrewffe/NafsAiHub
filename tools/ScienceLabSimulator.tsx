import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { BeakerIcon } from './Icons';

interface LabReport {
    experimentTitle: string;
    hypothesis: string;
    materials: string[];
    procedure: string[];
    observations: string;
    conclusion: string;
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

const Section: React.FC<{title: string, content: React.ReactNode}> = ({title, content}) => (
    <div>
        <h3 className="text-lg font-semibold text-accent mb-2">{title}</h3>
        <div className="bg-primary/50 p-3 rounded-md">{content}</div>
    </div>
);

export const renderScienceLabSimulatorOutput = (output: LabReport | string) => {
    let data: LabReport;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.experimentTitle || !Array.isArray(data.procedure)) {
        return <p className="text-red-400">Could not generate a valid lab report. Please describe the experiment more clearly.</p>;
    }
    return (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 space-y-6">
            <div className="text-center border-b border-slate-600 pb-4">
                <BeakerIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">{data.experimentTitle}</h2>
                <p className="text-sm text-slate-400">Simulated Lab Report</p>
            </div>

            <div className="space-y-4">
                <Section title="Hypothesis" content={<p className="text-slate-300 italic">{data.hypothesis}</p>} />
                <Section title="Materials" content={
                    <ul className="list-disc list-inside grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-300">
                        {data.materials.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                }/>
                <Section title="Procedure" content={
                    <ol className="list-decimal list-inside space-y-2 text-slate-300">
                        {data.procedure.map((step, i) => <li key={i}>{step}</li>)}
                    </ol>
                }/>
                 <Section title="Expected Observations" content={<p className="text-slate-300">{data.observations}</p>} />
                 <Section title="Conclusion" content={<p className="text-slate-300">{data.conclusion}</p>} />
            </div>
        </div>
    );
};

const ScienceLabSimulator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'science-lab-simulator')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'field',
            label: 'Scientific Field',
            type: 'select',
            defaultValue: 'Chemistry',
            options: [
                { value: 'Chemistry', label: 'Chemistry' },
                { value: 'Physics', label: 'Physics' },
                { value: 'Biology', label: 'Biology' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            experimentTitle: { type: GenAiType.STRING },
            hypothesis: { type: GenAiType.STRING, description: "A clear, testable statement." },
            materials: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING } },
            procedure: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "A list of step-by-step instructions." },
            observations: { type: GenAiType.STRING, description: "A description of the expected sensory observations." },
            conclusion: { type: GenAiType.STRING, description: "A conclusion that relates back to the hypothesis, explaining the scientific principles." },
        },
        required: ["experimentTitle", "hypothesis", "materials", "procedure", "observations", "conclusion"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { language, field } = options;
        const fullPrompt = `Based on the following description of a science experiment in the field of ${field}, generate a complete lab report. The report must include a title, a testable hypothesis, a list of materials, a numbered procedure, a description of expected observations, and a conclusion explaining the results. The entire response must be in ${language}.

        Experiment: "${prompt}"`;
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
            renderOutput={renderScienceLabSimulatorOutput}
        />
    );
};

export default ScienceLabSimulator;