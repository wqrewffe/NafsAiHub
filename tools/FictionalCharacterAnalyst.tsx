import React from 'react';
import ToolContainer from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { UserCircleIcon } from './Icons';

interface CharacterAnalysis {
    trait: string;
    description: string;
    evidence: string;
}

interface FictionalCharacterAnalystOutput {
    characterName: string;
    source: string;
    analysis: CharacterAnalysis[];
}

export const renderFictionalCharacterAnalystOutput = (output: FictionalCharacterAnalystOutput | string) => {
    let data: FictionalCharacterAnalystOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.characterName || !Array.isArray(data.analysis)) {
        return <p className="text-red-400">Could not analyze this character. Please be more specific.</p>;
    }

    return (
        <div className="bg-secondary p-6 rounded-lg border border-slate-700 space-y-6">
            <div className="text-center border-b border-slate-600 pb-4">
                <UserCircleIcon className="h-12 w-12 mx-auto text-accent mb-2" />
                <h2 className="text-3xl font-bold text-light">{data.characterName}</h2>
                <p className="text-slate-400">from <span className="italic">{data.source}</span></p>
            </div>

            <div className="space-y-4">
                {data.analysis.map((item, index) => (
                    <div key={index} className="bg-primary p-4 rounded-md">
                        <h3 className="text-xl font-semibold text-accent">{item.trait}</h3>
                        <p className="text-slate-300 mt-2">{item.description}</p>
                        <blockquote className="mt-3 border-l-4 border-sky-500 pl-3 text-sm italic text-slate-400">
                           {item.evidence}
                        </blockquote>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FictionalCharacterAnalyst: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'fictional-character-analyst')!;

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            characterName: { type: GenAiType.STRING },
            source: { type: GenAiType.STRING, description: "The book, movie, or series the character is from." },
            analysis: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        trait: { type: GenAiType.STRING, description: "A key personality trait (e.g., 'Courageous', 'Cunning')." },
                        description: { type: GenAiType.STRING, description: "An explanation of this trait as it applies to the character." },
                        evidence: { type: GenAiType.STRING, description: "A specific example or quote from the source material that demonstrates this trait." }
                    },
                    required: ["trait", "description", "evidence"]
                }
            }
        },
        required: ["characterName", "source", "analysis"]
    };

    const handleGenerate = async ({ prompt }: { prompt: string; options: any }) => {
        const fullPrompt = `Analyze the personality of the fictional character: "${prompt}". Identify their source material (book, movie, etc.). Provide a breakdown of 3-4 key personality traits, a description of each trait, and specific evidence (an action or quote) from the source to support your analysis.`;
        return generateJson(fullPrompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            onGenerate={handleGenerate}
            renderOutput={renderFictionalCharacterAnalystOutput}
        />
    );
};

export default FictionalCharacterAnalyst;
