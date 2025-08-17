import React from 'react';
import ToolContainer from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { LanguageIcon } from './Icons';

interface TranslationOutput {
    input: string;
    output: string;
    translationDirection: "Text to Emoji" | "Emoji to Text";
}

export const renderEmojiStoryTranslatorOutput = (output: TranslationOutput | string) => {
    let data: TranslationOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.output) {
        return <p className="text-red-400">Could not perform translation. Please try again.</p>;
    }
    
    const isEmojiOutput = data.translationDirection === "Text to Emoji";

    return (
        <div className="space-y-6">
            <div className="text-center">
                <LanguageIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Emoji Story Translator</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-primary p-4 rounded-lg">
                    <h3 className="font-semibold text-slate-400 text-center mb-2">Original Input</h3>
                    <div className={`p-4 rounded-md bg-secondary text-center ${!isEmojiOutput ? 'text-4xl' : ''}`}>
                       {data.input}
                    </div>
                </div>
                 <div className="bg-primary p-4 rounded-lg">
                    <h3 className="font-semibold text-slate-400 text-center mb-2">Translated Output</h3>
                    <div className={`p-4 rounded-md bg-secondary text-center ${isEmojiOutput ? 'text-4xl' : ''}`}>
                        {data.output}
                    </div>
                </div>
            </div>
        </div>
    );
};

const EmojiStoryTranslator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'emoji-story-translator')!;

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            input: { type: GenAiType.STRING, description: "The original user input." },
            output: { type: GenAiType.STRING, description: "The translated output (either text or a string of emojis)." },
            translationDirection: { type: GenAiType.STRING, enum: ["Text to Emoji", "Emoji to Text"] }
        },
        required: ["input", "output", "translationDirection"]
    };

    const handleGenerate = async ({ prompt }: { prompt: string; options: Record<string, any> }) => {
        const fullPrompt = `Analyze the following input. Determine if it's primarily text or a string of emojis. 
        If it's text, translate its narrative and emotional meaning into a story told with emojis. 
        If it's emojis, translate it into a coherent short text narrative. 
        Provide the original input, the translated output, and the direction of translation.

        Input: "${prompt}"`;
        return generateJson(fullPrompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            onGenerate={handleGenerate}
            renderOutput={renderEmojiStoryTranslatorOutput}
        />
    );
};

export default EmojiStoryTranslator;
