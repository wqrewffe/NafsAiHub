import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { SparklesIcon } from './Icons';

interface Device {
    device: string;
    quote: string;
    explanation: string;
    effect: string;
}

interface LiteraryOutput {
    devices: Device[];
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

export const renderLiteraryDeviceSpotterOutput = (output: LiteraryOutput | string) => {
    let data: LiteraryOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.devices) || data.devices.length === 0) {
        return <p className="text-red-400">No literary devices were identified. Please try with a different text.</p>;
    }
    return (
        <div className="space-y-6">
            <div className="text-center">
                <SparklesIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Literary Analysis</h2>
            </div>
            <div className="space-y-4">
                {data.devices.map((item, index) => (
                    <div key={index} className="bg-secondary p-4 rounded-lg border border-slate-700">
                        <h3 className="text-xl font-bold text-accent">{item.device}</h3>
                        <blockquote className="border-l-4 border-sky-500 pl-4 my-3">
                            <p className="italic text-slate-300">"{item.quote}"</p>
                        </blockquote>
                        <div className="space-y-2 text-sm">
                            <p><strong className="text-slate-200">Explanation:</strong> <span className="text-slate-400">{item.explanation}</span></p>
                            <p><strong className="text-slate-200">Effect on Reader:</strong> <span className="text-slate-400">{item.effect}</span></p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LiteraryDeviceSpotter: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'literary-device-spotter')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'focusOn',
            label: 'Focus On',
            type: 'select',
            defaultValue: 'Figurative Language',
            options: [
                { value: 'Figurative Language', label: 'Figurative Language (Metaphor, Simile, etc.)' },
                { value: 'Sound Devices', label: 'Sound Devices (Alliteration, Assonance, etc.)' },
                { value: 'Structural Elements', label: 'Structural Elements (Foreshadowing, Juxtaposition, etc.)' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            devices: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        device: { type: GenAiType.STRING, description: "The name of the literary device (e.g., 'Metaphor', 'Personification')." },
                        quote: { type: GenAiType.STRING, description: "The exact quote from the text containing the device." },
                        explanation: { type: GenAiType.STRING, description: "A brief explanation of how the quote demonstrates the device." },
                        effect: { type: GenAiType.STRING, description: "The intended effect of this device on the reader." },
                    },
                    required: ["device", "quote", "explanation", "effect"]
                }
            }
        },
        required: ["devices"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { language, focusOn } = options;
        const fullPrompt = `Analyze the following text for literary devices, with a specific focus on '${focusOn}'. Identify at least 4 distinct devices from that category. For each device, provide its name, the exact quote, an explanation of how it's used, and the effect it has on the reader. The entire response (explanation, effect, etc.) must be in ${language}.

        Text: "${prompt}"`;
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
            renderOutput={renderLiteraryDeviceSpotterOutput}
        />
    );
};

export default LiteraryDeviceSpotter;