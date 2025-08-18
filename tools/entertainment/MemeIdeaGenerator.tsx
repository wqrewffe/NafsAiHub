import React, { useState } from 'react';
import ToolContainer, { ToolOptionConfig } from '../common/ToolContainer';
import { generateJson, GenAiType } from '../../services/geminiService';
import { tools } from '../index';
import { FaceSmileIcon } from '../Icons';

interface MemeIdeaOutput {
    memeFormat: string;
    translations: {
        en: { topText: string; bottomText: string };
        es: { topText: string; bottomText: string };
        fr: { topText: string; bottomText: string };
        de: { topText: string; bottomText: string };
        hi: { topText: string; bottomText: string };
        bn: { topText: string; bottomText: string };
        ja: { topText: string; bottomText: string };
    };
}

export const renderMemeIdeaGeneratorOutput = (output: MemeIdeaOutput | string) => {
    const [selectedLang, setSelectedLang] = useState<'en' | 'es' | 'fr' | 'de' | 'hi' | 'bn' | 'ja'>('en');

    let data: MemeIdeaOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.translations) {
        return <p className="text-red-400">Could not generate a meme idea. Please try a different topic.</p>;
    }

    const texts = data.translations[selectedLang];

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-center text-light">
                {data.memeFormat}
            </h3>

            <div className="flex justify-center space-x-2 mb-4">
                {Object.keys(data.translations).map(lang => (
                    <button
                        key={lang}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${selectedLang === lang ? 'bg-accent text-white' : 'bg-slate-700 text-light'}`}
                        onClick={() => setSelectedLang(lang as any)}
                    >
                        {lang.toUpperCase()}
                    </button>
                ))}
            </div>

            <div className="bg-primary border border-slate-700 rounded-lg p-4 font-bold text-center text-xl tracking-wide space-y-2">
                <p className="text-accent capitalize">{selectedLang.toUpperCase()}</p>
                <p className="text-light">{texts.topText}</p>
                <p className="text-light">{texts.bottomText}</p>
            </div>
        </div>
    );
};

const MemeIdeaGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'meme-idea-generator')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'memeFormat',
            label: 'Meme Format',
            type: 'select',
            defaultValue: 'Distracted ',
            options: [
                { value: 'Distracted ', label: 'Distracted ' },
                { value: 'Drakeposting', label: 'Drakeposting' },
                { value: 'Woman Yelling at a Cat', label: 'Woman Yelling at a Cat' },
                { value: 'Expanding Brain', label: 'Expanding Brain' },
                { value: 'Two Buttons', label: 'Two Buttons' },
            ]
        }
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            memeFormat: { type: GenAiType.STRING },
            translations: {
                type: GenAiType.OBJECT,
                properties: {
                    en: {
                        type: GenAiType.OBJECT,
                        properties: {
                            topText: { type: GenAiType.STRING },
                            bottomText: { type: GenAiType.STRING },
                        }
                    },
                    es: {
                        type: GenAiType.OBJECT,
                        properties: {
                            topText: { type: GenAiType.STRING },
                            bottomText: { type: GenAiType.STRING },
                        }
                    },
                    fr: {
                        type: GenAiType.OBJECT,
                        properties: {
                            topText: { type: GenAiType.STRING },
                            bottomText: { type: GenAiType.STRING },
                        }
                    },
                    de: {
                        type: GenAiType.OBJECT,
                        properties: {
                            topText: { type: GenAiType.STRING },
                            bottomText: { type: GenAiType.STRING },
                        }
                    },
                    hi: {
                        type: GenAiType.OBJECT,
                        properties: {
                            topText: { type: GenAiType.STRING },
                            bottomText: { type: GenAiType.STRING },
                        }
                    },
                    bn: {
                        type: GenAiType.OBJECT,
                        properties: {
                            topText: { type: GenAiType.STRING },
                            bottomText: { type: GenAiType.STRING },
                        }
                    },
                    ja: {
                        type: GenAiType.OBJECT,
                        properties: {
                            topText: { type: GenAiType.STRING },
                            bottomText: { type: GenAiType.STRING },
                        }
                    }
                },
                required: ["en", "es", "fr", "de", "hi", "bn", "ja"]
            }
        },
        required: ["memeFormat", "translations"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { memeFormat } = options;
        const fullPrompt = `Generate funny meme text for the \"${memeFormat}\" meme format in 7 languages: English (en), Spanish (es), French (fr), German (de), Hindi (hi), Bengali (bn), Japanese (ja). The meme should be about this topic: \"${prompt}\". Provide topText and bottomText for each language.`;
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
            renderOutput={renderMemeIdeaGeneratorOutput}
        />
    );
};

export default MemeIdeaGenerator;
