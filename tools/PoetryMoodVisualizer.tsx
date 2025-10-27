import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { PaintBrushIcon } from './Icons';

interface PoetryAnalysis {
    poemTitle: string;
    analysis: {
        mood: string;
        themes: string[];
        tone: string;
    };
    colorPalette: {
        hexCodes: string[];
        justification: string;
    };
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

export const renderPoetryMoodVisualizerOutput = (output: PoetryAnalysis | string) => {
    let data: PoetryAnalysis;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.analysis || !data.colorPalette) {
        return <p className="text-red-400">Could not generate a valid analysis. Please ensure you have pasted the full poem.</p>;
    }
    return (
        <div className="space-y-6">
            <div className="text-center">
                <PaintBrushIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Visual Analysis of <span className="text-accent">{data.poemTitle}</span></h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-secondary p-4 rounded-lg">
                    <h3 className="font-bold text-lg text-light mb-3">Literary Analysis</h3>
                    <p className="mb-2"><strong className="text-slate-300">Mood:</strong> <span className="text-slate-400">{data.analysis.mood}</span></p>
                    <p className="mb-2"><strong className="text-slate-300">Tone:</strong> <span className="text-slate-400">{data.analysis.tone}</span></p>
                    <p><strong className="text-slate-300">Themes:</strong> <span className="text-slate-400">{data.analysis.themes.join(', ')}</span></p>
                </div>
                <div className="bg-secondary p-4 rounded-lg">
                    <h3 className="font-bold text-lg text-light mb-3">Mood Palette</h3>
                    <div className="flex space-x-2 mb-3 h-16">
                        {data.colorPalette.hexCodes.map((hex, i) => (
                            <div key={i} className="flex-1 rounded-md" style={{ backgroundColor: hex }} title={hex}></div>
                        ))}
                    </div>
                    <p className="text-sm text-slate-400 italic">{data.colorPalette.justification}</p>
                </div>
            </div>
        </div>
    );
};

const PoetryMoodVisualizer: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'poetry-mood-visualizer')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'paletteStyle',
            label: 'Palette Style',
            type: 'select',
            defaultValue: 'Vibrant',
            options: [
                { value: 'Vibrant', label: 'Vibrant' },
                { value: 'Muted', label: 'Muted' },
                { value: 'Monochromatic', label: 'Monochromatic' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            poemTitle: { type: GenAiType.STRING, description: "The title of the poem analyzed." },
            analysis: {
                type: GenAiType.OBJECT,
                properties: {
                    mood: { type: GenAiType.STRING, description: "The overall feeling or atmosphere of the poem." },
                    themes: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "The main ideas or underlying messages." },
                    tone: { type: GenAiType.STRING, description: "The author's attitude towards the subject." }
                },
                required: ["mood", "themes", "tone"]
            },
            colorPalette: {
                type: GenAiType.OBJECT,
                properties: {
                    hexCodes: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "An array of 5 hex color codes." },
                    justification: { type: GenAiType.STRING, description: "An explanation of how the colors represent the poem's mood." }
                },
                required: ["hexCodes", "justification"]
            }
        },
        required: ["poemTitle", "analysis", "colorPalette"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { language, paletteStyle } = options;
        const fullPrompt = `Analyze the poem provided. Identify its title, mood, themes, and tone. Then, based on this analysis, generate a representative color palette of 5 hex codes with a '${paletteStyle}' style and provide a justification for your color choices. The entire analysis and justification must be in ${language}.

        Poem: "${prompt}"`;
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
            renderOutput={renderPoetryMoodVisualizerOutput}
        />
    );
};

export default PoetryMoodVisualizer;