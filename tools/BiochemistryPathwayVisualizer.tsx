import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { MoleculeIcon, ChevronDownIcon } from './Icons';

interface PathwayOutput {
    pathwayName: string;
    description: string;
    steps: string[];
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

export const renderBiochemistryPathwayVisualizerOutput = (output: PathwayOutput | string) => {
    let data: PathwayOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.pathwayName || !Array.isArray(data.steps)) {
        return <p className="text-red-400">Could not generate pathway. Please provide a clearer topic.</p>;
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <MoleculeIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">{data.pathwayName}</h2>
                <p className="text-slate-400 mt-1 italic">"{data.description}"</p>
            </div>
            
            <div className="flex flex-col items-center">
                {data.steps.map((step, index) => (
                    <React.Fragment key={index}>
                        <div className="bg-secondary p-3 rounded-lg shadow-md text-center w-full max-w-lg">
                           <span className="font-mono text-light">{step}</span>
                        </div>
                        {index < data.steps.length - 1 && (
                           <ChevronDownIcon className="h-6 w-6 text-slate-500 mx-auto my-1" />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};


const BiochemistryPathwayVisualizer: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'biochemistry-pathway-visualizer')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'detailLevel',
            label: 'Detail Level',
            type: 'select',
            defaultValue: 'Key Intermediates',
            options: [
                { value: 'High-Level Overview', label: 'High-Level Overview' },
                { value: 'Key Intermediates', label: 'Key Intermediates & Enzymes' },
                { value: 'Detailed', label: 'Detailed (with cofactors)' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            pathwayName: { type: GenAiType.STRING },
            description: { type: GenAiType.STRING, description: "A one-sentence summary of the pathway's purpose." },
            steps: {
                type: GenAiType.ARRAY,
                items: { type: GenAiType.STRING },
                description: "An array of strings representing the steps, showing substrates, enzymes, and products in a linear flow."
            }
        },
        required: ["pathwayName", "description", "steps"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { language, detailLevel } = options;
        const fullPrompt = `Generate a text-based flowchart for the biochemical pathway: "${prompt}". Provide the pathway name, a one-sentence description of its purpose, and then a list of the key steps. The level of detail should be '${detailLevel}'. The entire response must be in ${language}.

        For each step, show the substrate, the enzyme (in parentheses), and the product. For example: "Substrate A --(Enzyme 1)--> Product B".`;
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
            renderOutput={renderBiochemistryPathwayVisualizerOutput}
        />
    );
};

export default BiochemistryPathwayVisualizer;