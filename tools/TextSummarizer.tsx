import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { DocumentMagnifyingGlassIcon } from './Icons';

interface SummaryPoint {
    heading: string;
    points: string[];
}

// Updated to support paragraph format
interface SummaryOutput {
    originalWordCount: number;
    summaryWordCount: number;
    keyPoints?: SummaryPoint[]; // Optional for list format
    summaryParagraph?: string; // Optional for paragraph format
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

export const renderTextSummarizerOutput = (output: SummaryOutput | string) => {
    let data: SummaryOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || (!data.keyPoints && !data.summaryParagraph)) {
        return <p className="text-red-400">Could not generate a summary. Please try again with different text.</p>;
    }
    
    const reduction = data.originalWordCount > 0 
        ? Math.round(((data.originalWordCount - data.summaryWordCount) / data.originalWordCount) * 100) 
        : 0;
        
    return (
        <div className="space-y-6">
            <div className="text-center">
                 <DocumentMagnifyingGlassIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                 <h2 className="text-2xl font-bold text-light">Summary</h2>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-center bg-secondary p-4 rounded-lg">
                <div className="flex-1 min-w-[150px]">
                    <p className="text-sm text-slate-400">Original Word Count</p>
                    <p className="font-bold text-2xl text-light">{data.originalWordCount}</p>
                </div>
                <div className="flex-1 min-w-[150px]">
                    <p className="text-sm text-slate-400">Summary Word Count</p>
                    <p className="font-bold text-2xl text-light">{data.summaryWordCount}</p>
                </div>
                <div className="flex-1 min-w-[150px]">
                    <p className="text-sm text-slate-400">Reduction</p>
                    <p className="font-bold text-2xl text-accent">{reduction}%</p>
                </div>
            </div>

            {data.keyPoints && (
                 <div className="space-y-4">
                    {data.keyPoints.map((section, index) => (
                        <div key={index}>
                            <h4 className="font-semibold text-lg text-accent mb-2">{section.heading}</h4>
                            <ul className="space-y-2 list-disc list-inside pl-4">
                                {section.points.map((point, pIndex) => (
                                    <li key={pIndex} className="text-slate-300">{point}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            {data.summaryParagraph && (
                <div>
                     <h4 className="font-semibold text-lg text-accent mb-2">Paragraph Summary</h4>
                     <p className="text-slate-300 whitespace-pre-wrap">{data.summaryParagraph}</p>
                </div>
            )}
        </div>
    );
};

const TextSummarizer: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'text-summarizer')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'length',
            label: 'Summary Length',
            type: 'select',
            defaultValue: 'Medium',
            options: [
                { value: 'Short', label: 'Short (Key points only)' },
                { value: 'Medium', label: 'Medium (Balanced)' },
                { value: 'Detailed', label: 'Detailed (More context)' },
            ]
        },
        {
            name: 'format',
            label: 'Format',
            type: 'select',
            defaultValue: 'Bulleted List',
            options: [
                { value: 'Bulleted List', label: 'Bulleted List' },
                { value: 'Paragraph', label: 'Paragraph' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            originalWordCount: { type: GenAiType.NUMBER },
            summaryWordCount: { type: GenAiType.NUMBER },
            keyPoints: {
                type: GenAiType.ARRAY,
                description: "A list of key topics and their summary points. Use only for 'Bulleted List' format.",
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        heading: { type: GenAiType.STRING, description: "The main idea or heading for a set of points." },
                        points: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "A list of bullet points under that heading." },
                    },
                    required: ['heading', 'points'],
                },
            },
            summaryParagraph: { type: GenAiType.STRING, description: "A single cohesive paragraph summary. Use only for 'Paragraph' format."}
        },
        required: ['originalWordCount', 'summaryWordCount'],
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { length, language, format } = options;
        const wordCount = prompt.trim().split(/\s+/).length;
        const fullPrompt = `Summarize the following text into a '${format}' format. The summary should be of ${length} length. Also, provide the word count of the original text and the final summary. The entire response must be in ${language}.\n\nOriginal Word Count: ${wordCount}\n\nText: "${prompt}"`;
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
            renderOutput={renderTextSummarizerOutput}
        />
    );
};

export default TextSummarizer;