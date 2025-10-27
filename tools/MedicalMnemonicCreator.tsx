import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { PuzzlePieceIcon } from './Icons';

interface BreakdownItem {
    letter: string;
    meaning: string;
}

interface MnemonicOutput {
    topic: string;
    mnemonic: string;
    breakdown: BreakdownItem[];
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

export const renderMedicalMnemonicCreatorOutput = (output: MnemonicOutput | string) => {
    let data: MnemonicOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.mnemonic || !Array.isArray(data.breakdown)) {
        return <p className="text-red-400">Could not generate a mnemonic. Please specify a clearer topic.</p>;
    }
    return (
        <div className="bg-gradient-to-br from-secondary to-primary p-6 rounded-lg border border-slate-700 shadow-xl">
            <div className="text-center mb-6">
                <PuzzlePieceIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-xl font-bold text-light">Mnemonic for: <span className="text-accent">{data.topic}</span></h2>
            </div>
            
            <div className="bg-primary/50 p-6 rounded-lg text-center mb-6">
                <p className="text-3xl font-bold text-light tracking-widest">"{data.mnemonic}"</p>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-light text-center mb-3">Breakdown:</h3>
                <div className="max-w-md mx-auto">
                    {data.breakdown.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4 p-2 border-b border-slate-700 last:border-b-0">
                            <span className="text-2xl font-black text-accent w-8 text-center">{item.letter}</span>
                            <span className="text-slate-300">=</span>
                            <span className="text-slate-300">{item.meaning}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const MedicalMnemonicCreator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'medical-mnemonic-creator')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'style',
            label: 'Mnemonic Style',
            type: 'select',
            defaultValue: 'Simple',
            options: [
                { value: 'Humorous', label: 'Humorous' },
                { value: 'Simple', label: 'Simple & Direct' },
                { value: 'Medical Jargon', label: 'Clinically-focused' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            topic: { type: GenAiType.STRING },
            mnemonic: { type: GenAiType.STRING, description: "A creative and memorable mnemonic phrase." },
            breakdown: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        letter: { type: GenAiType.STRING, description: "The letter from the mnemonic." },
                        meaning: { type: GenAiType.STRING, description: "What that letter stands for." }
                    },
                    required: ["letter", "meaning"]
                }
            }
        },
        required: ["topic", "mnemonic", "breakdown"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { language, style } = options;
        const fullPrompt = `Create a clever and memorable medical mnemonic for the following topic. The mnemonic should be of a '${style}' style and make sense in the ${language} language. Provide the topic, the mnemonic phrase itself, and a breakdown of what each letter stands for. The entire response must be in ${language}.

        Topic: "${prompt}"`;
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
            renderOutput={renderMedicalMnemonicCreatorOutput}
        />
    );
};

export default MedicalMnemonicCreator;