import React, { useState } from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';

interface Flashcard {
  term: string;
  definition: string;
}

interface FlashcardOutput {
  flashcards: Flashcard[];
}

const Flashcard: React.FC<{ card: Flashcard }> = ({ card }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div className="[perspective:1000px] h-48 w-full" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`relative h-full w-full rounded-lg shadow-md transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                <div className="absolute inset-0 bg-secondary p-4 rounded-lg flex items-center justify-center [backface-visibility:hidden]">
                    <p className="text-center font-bold text-light">{card.term}</p>
                </div>
                <div className="absolute inset-0 bg-primary p-4 rounded-lg flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <p className="text-center text-slate-300">{card.definition}</p>
                </div>
            </div>
        </div>
    );
};

export const renderFlashcardGeneratorOutput = (output: FlashcardOutput | string) => {
    let data: FlashcardOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.flashcards) || data.flashcards.length === 0) {
        return <p className="text-red-400">Could not generate flashcards. Please try another topic.</p>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.flashcards.map((card, index) => (
                <Flashcard key={index} card={card} />
            ))}
        </div>
    );
};

const FlashcardGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'flashcard-generator');
    if (!toolInfo) return null;
    
    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'numFlashcards',
            label: 'Number of Flashcards',
            type: 'number',
            defaultValue: 8,
            min: 4,
            max: 20,
        },
        {
            name: 'difficulty',
            label: 'Difficulty',
            type: 'select',
            defaultValue: 'High School',
            options: [
                { value: 'Beginner', label: 'Beginner' },
                { value: 'High School', label: 'High School' },
                { value: 'University', label: 'University' },
            ]
        }
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            flashcards: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        term: { type: GenAiType.STRING, description: "The term or question for the front of the flashcard." },
                        definition: { type: GenAiType.STRING, description: "The definition or answer for the back of the flashcard." }
                    },
                    required: ["term", "definition"]
                }
            }
        },
        required: ["flashcards"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { numFlashcards, difficulty } = options;
        const fullPrompt = `Generate a set of ${numFlashcards} flashcards for the topic: "${prompt}". The complexity of the terms and definitions should be appropriate for a '${difficulty}' level. For each flashcard, provide a "term" and a "definition".`;
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
            renderOutput={renderFlashcardGeneratorOutput}
        />
    );
};

export default FlashcardGenerator;
