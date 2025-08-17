
import React, { useState } from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { ClipboardDocumentIcon, CheckCircleIcon } from './Icons';

interface CodeExplanation {
    code: string;
    language: string;
    explanation: Array<{
        lines: string;
        detail: string;
    }>;
}

const languageOptions: ToolOptionConfig = {
    name: 'explanationLanguage',
    label: 'Explanation Language',
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

const CodeExplanationRenderer = ({ content }: { content: CodeExplanation }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!content || !content.code || !content.explanation) {
        return <p className="text-red-400">The generated explanation is malformed. Please try again.</p>;
    }

    return (
        <div className="space-y-6">
            <div>
                <div className="bg-slate-900 rounded-t-md px-4 py-2 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase">{content.language || 'Code'}</span>
                    <button onClick={handleCopy} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                        {copied ? <CheckCircleIcon className="h-5 w-5 text-green-400" /> : <ClipboardDocumentIcon className="h-5 w-5" />}
                        {copied ? 'Copied!' : 'Copy Code'}
                    </button>
                </div>
                <pre className="bg-primary p-4 rounded-b-md text-cyan-300 overflow-x-auto font-mono text-sm">
                    <code>{content.code}</code>
                </pre>
            </div>
            <div>
                <h4 className="text-lg font-semibold text-light mb-2">Line-by-Line Explanation</h4>
                <div className="border border-slate-700 rounded-md overflow-hidden">
                    <table className="w-full divide-y divide-slate-700">
                        <thead className="bg-slate-800">
                            <tr>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider w-1/4">Lines</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Explanation</th>
                            </tr>
                        </thead>
                        <tbody className="bg-primary divide-y divide-slate-700">
                            {content.explanation.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-slate-400 text-center">{item.lines}</td>
                                    <td className="px-4 py-3 text-sm text-slate-300 leading-relaxed">{item.detail}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export const renderCodeExplainerOutput = (output: CodeExplanation | string) => {
    let data: CodeExplanation;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }
    return <CodeExplanationRenderer content={data} />;
};


const CodeExplainer: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'code-explainer')!;
    
    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'verbosity',
            label: 'Explanation Verbosity',
            type: 'select',
            defaultValue: 'Detailed',
            options: [
                { value: 'Concise', label: 'Concise' },
                { value: 'Detailed', label: 'Detailed' },
                { value: 'Beginner-Friendly', label: 'Beginner-Friendly' },
            ]
        },
        {
            name: 'targetAudience',
            label: 'Target Audience',
            type: 'select',
            defaultValue: 'Student',
            options: [
                { value: 'Beginner Coder', label: 'Beginner Coder' },
                { value: 'Experienced Developer', label: 'Experienced Developer' },
                { value: 'Student', label: 'Student' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            code: { type: GenAiType.STRING, description: "The original code snippet, unchanged." },
            language: { type: GenAiType.STRING, description: "The programming language of the code (e.g., 'JavaScript', 'Python')." },
            explanation: {
                type: GenAiType.ARRAY,
                description: "An array of objects, each explaining a part of the code.",
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        lines: { type: GenAiType.STRING, description: "The line number(s) this explanation refers to (e.g., '1', '2-4')." },
                        detail: { type: GenAiType.STRING, description: "The detailed explanation for that part of the code." },
                    },
                    required: ['lines', 'detail'],
                }
            },
        },
        required: ['code', 'language', 'explanation'],
    };

    const handleGenerate = async ({ prompt: codeSnippet, options }: { prompt: string; options: any }) => {
        const { verbosity, explanationLanguage, targetAudience } = options;
        const prompt = `Analyze the following code snippet. Provide the original code, identify the programming language, and give a ${verbosity}, line-by-line explanation of its functionality. The explanation should be tailored for a '${targetAudience}'. The explanation text should be in ${explanationLanguage}.\n\nCode:\n${codeSnippet}`;
        return generateJson(prompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            optionsConfig={optionsConfig}
            onGenerate={handleGenerate}
            renderOutput={renderCodeExplainerOutput}
        />
    );
};

export default CodeExplainer;
