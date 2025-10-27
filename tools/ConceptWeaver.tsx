import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { ShareIcon } from './Icons';

interface ConceptWeaverOutput {
    conceptA: string;
    conceptB: string;
    connections: string[];
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
    ]
};

export const renderConceptWeaverOutput = (output: ConceptWeaverOutput | string) => {
    let data: ConceptWeaverOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.conceptA || !Array.isArray(data.connections)) {
        return <p className="text-red-400">Could not weave concepts. Please provide two distinct concepts to connect.</p>;
    }

    const allNodes = [data.conceptA, ...data.connections, data.conceptB];

    return (
        <div className="space-y-6">
            <div className="text-center">
                <ShareIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Concept Weaver</h2>
            </div>
            
            <div className="flex flex-col items-center">
                {allNodes.map((node, index) => (
                    <React.Fragment key={index}>
                        <div className={`p-4 rounded-lg shadow-lg text-center ${index === 0 || index === allNodes.length - 1 ? 'bg-accent text-primary font-bold' : 'bg-secondary text-light'} w-full max-w-md`}>
                            {node}
                        </div>
                        {index < allNodes.length - 1 && (
                            <div className="h-8 w-1 bg-slate-600 my-2"></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

const ConceptWeaver: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'concept-weaver')!;

    const optionsConfig: ToolOptionConfig[] = [
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            conceptA: { type: GenAiType.STRING },
            conceptB: { type: GenAiType.STRING },
            connections: {
                type: GenAiType.ARRAY,
                items: { type: GenAiType.STRING },
                description: "An array of 3-5 strings, each representing a logical step connecting Concept A to Concept B."
            }
        },
        required: ["conceptA", "conceptB", "connections"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { language } = options;
        const fullPrompt = `Act as a creative synthesizer. The user wants to connect two seemingly unrelated concepts. Identify the two concepts from the prompt. Then, generate a plausible, creative, step-by-step chain of connections that links the first concept to the second. Provide 3-5 connecting steps. The entire response must be in ${language}.

        User Prompt: "${prompt}"`;
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
            renderOutput={renderConceptWeaverOutput}
        />
    );
};

export default ConceptWeaver;