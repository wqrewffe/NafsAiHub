import React, { useState } from 'react';
import ToolContainer from '../common/ToolContainer';
import { generateJson, GenAiType } from '../../services/geminiService';
import { tools } from '../index';
import { DocumentTextIcon, ClipboardDocumentIcon, CheckCircleIcon } from '../Icons';

interface PseudocodeOutput {
    taskDescription: string;
    pseudocode: string;
}

// ✅ Make a proper component to handle hooks
const PseudocodeOutputViewer: React.FC<{ output: PseudocodeOutput | string }> = ({ output }) => {
    const [copied, setCopied] = useState(false);

    let data: PseudocodeOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.pseudocode) {
        return <p className="text-red-400">
            Could not generate pseudocode. Please describe the process more clearly.
        </p>;
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(data.pseudocode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-4">
            <div className="text-center">
                <DocumentTextIcon className="h-8 w-8 mx-auto text-accent mb-2" />
                <h2 className="text-xl font-bold text-light">
                    Pseudocode for: <span className="text-accent">{data.taskDescription}</span>
                </h2>
            </div>
            <div className="relative">
                <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 flex items-center gap-2 text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-md transition-colors"
                >
                    {copied
                        ? <CheckCircleIcon className="h-4 w-4 text-green-400" />
                        : <ClipboardDocumentIcon className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
                <pre className="bg-primary p-4 rounded-md text-cyan-300 overflow-x-auto font-mono text-sm border border-slate-700">
                    <code>{data.pseudocode}</code>
                </pre>
            </div>
        </div>
    );
};

// ✅ Legacy export to maintain old imports if needed
export const renderPseudocodeGeneratorOutput = (output: PseudocodeOutput | string) => (
    <PseudocodeOutputViewer output={output} />
);

const PseudocodeGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'pseudocode-generator')!;

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            taskDescription: { type: GenAiType.STRING, description: "A summary of the task." },
            pseudocode: {
                type: GenAiType.STRING,
                description: "The structured, well-formatted pseudocode, using standard conventions like FUNCTION, IF/ELSE, FOR, etc."
            },
        },
        required: ["taskDescription", "pseudocode"]
    };

    const handleGenerate = async ({ prompt }: { prompt: string; options: any }) => {
        const fullPrompt = `Convert the following plain English description of a process into clear, structured, and well-commented pseudocode. Use standard pseudocode conventions (e.g., FUNCTION, IF/ELSE, FOR, WHILE, RETURN).

Process Description: "${prompt}"`;
        return generateJson(fullPrompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            onGenerate={handleGenerate}
            renderOutput={(output) => <PseudocodeOutputViewer output={output} />}
        />
    );
};

export default PseudocodeGenerator;
