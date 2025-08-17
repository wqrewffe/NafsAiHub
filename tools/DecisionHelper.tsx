import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { CheckCircleIcon, XCircleIcon, LightBulbIcon } from './Icons';

interface DecisionOutput {
    decision: string;
    pros: string[];
    cons: string[];
    recommendation: string;
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

export const renderDecisionHelperOutput = (output: DecisionOutput | string) => {
    let data: DecisionOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.pros) || !Array.isArray(data.cons)) {
        return <p className="text-red-400">Could not generate a valid decision analysis. Please try again.</p>;
    }
    return (
        <div className="space-y-6">
            <h3 className="text-center text-xl font-semibold text-light">Analysis for: <span className="text-accent">{data.decision}</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pros Column */}
                <div className="bg-primary/50 p-4 rounded-lg border border-green-500/30">
                    <h4 className="flex items-center text-lg font-bold text-green-400 mb-3">
                        <CheckCircleIcon className="h-6 w-6 mr-2" />
                        Pros
                    </h4>
                    <ul className="space-y-2">
                        {data.pros.map((pro, index) => (
                            <li key={index} className="flex items-start">
                                <span className="text-green-400 mr-2 mt-1">&#10003;</span>
                                <span className="text-slate-300">{pro}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                {/* Cons Column */}
                <div className="bg-primary/50 p-4 rounded-lg border border-red-500/30">
                    <h4 className="flex items-center text-lg font-bold text-red-400 mb-3">
                        <XCircleIcon className="h-6 w-6 mr-2" />
                        Cons
                    </h4>
                    <ul className="space-y-2">
                        {data.cons.map((con, index) => (
                            <li key={index} className="flex items-start">
                                <span className="text-red-400 mr-2 mt-1">&#10007;</span>
                                <span className="text-slate-300">{con}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            {/* Recommendation Section */}
            <div className="mt-6">
                 <h4 className="flex items-center text-lg font-bold text-amber-400 mb-3">
                    <LightBulbIcon className="h-6 w-6 mr-2" />
                    AI Recommendation
                </h4>
                <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-amber-400">
                    <p className="text-slate-300 italic">{data.recommendation}</p>
                </div>
            </div>
        </div>
    );
};

const DecisionHelper: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'decision-helper')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'numPoints',
            label: 'Number of Pros/Cons',
            type: 'number',
            defaultValue: 3,
            min: 2,
            max: 5,
        },
        {
            name: 'perspective',
            label: 'Perspective',
            type: 'select',
            defaultValue: 'Personal',
            options: [
                { value: 'Personal', label: 'Personal' },
                { value: 'Business', label: 'Business' },
                { value: 'Societal', label: 'Societal' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            decision: { type: GenAiType.STRING, description: "The core decision being analyzed." },
            pros: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "A list of advantages or positive points." },
            cons: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "A list of disadvantages or negative points." },
            recommendation: { type: GenAiType.STRING, description: "A concluding summary or recommendation based on the analysis." },
        },
        required: ['decision', 'pros', 'cons', 'recommendation'],
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { numPoints, language, perspective } = options;
        const fullPrompt = `Analyze the following decision to help me make a choice: "${prompt}". Provide a concise summary of the decision, a balanced list of ${numPoints} pros and ${numPoints} cons, and a final, thoughtful recommendation, all from a '${perspective}' perspective. The entire response must be in ${language}.`;
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
            renderOutput={renderDecisionHelperOutput}
        />
    );
};

export default DecisionHelper;