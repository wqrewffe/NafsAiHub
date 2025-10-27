import React from 'react';
import ToolContainer from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { BoltIcon } from './Icons';

interface RecipeFusionOutput {
    fusionName: string;
    cuisines: string[];
    description: string;
    ingredients: string[];
    instructions: string[];
}

export const renderRecipeFusionChefOutput = (output: RecipeFusionOutput | string) => {
    let data: RecipeFusionOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.fusionName || !Array.isArray(data.ingredients)) {
        return <p className="text-red-400">Could not generate a fusion recipe. Please try two distinct cuisines.</p>;
    }
    return (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg">
            <div className="text-center mb-6">
                <BoltIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-3xl font-bold text-light">{data.fusionName}</h2>
                <p className="text-slate-400 mt-1">A fusion of <span className="font-semibold text-accent">{data.cuisines.join(' & ')}</span></p>
                <p className="text-slate-400 mt-2 italic">"{data.description}"</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <h3 className="text-xl font-semibold text-accent mb-3">Ingredients</h3>
                    <ul className="space-y-2">
                        {data.ingredients.map((item, index) => (
                            <li key={index} className="flex">
                                <span className="text-accent mr-2">&#9679;</span>
                                <span className="text-slate-300">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="md:col-span-2">
                    <h3 className="text-xl font-semibold text-accent mb-3">Instructions</h3>
                    <ol className="space-y-3">
                        {data.instructions.map((step, index) => (
                            <li key={index} className="flex">
                                <span className="bg-accent text-primary font-bold rounded-full h-6 w-6 text-center mr-3 flex-shrink-0">{index + 1}</span>
                                <p className="text-slate-300 leading-relaxed">{step}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </div>
    );
};

const RecipeFusionChef: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'recipe-fusion-chef')!;

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            fusionName: { type: GenAiType.STRING },
            cuisines: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "The two cuisines being fused." },
            description: { type: GenAiType.STRING },
            ingredients: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING } },
            instructions: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING } },
        },
        required: ["fusionName", "cuisines", "description", "ingredients", "instructions"],
    };

    const handleGenerate = async ({ prompt }: { prompt: string; options: any }) => {
        const fullPrompt = `Act as an innovative fusion chef. Create a unique recipe that combines the two cuisines mentioned in the prompt. Give the dish a creative name, list the fused cuisines, describe the dish, and provide a list of ingredients and step-by-step instructions.

        Cuisines to fuse: "${prompt}"`;
        return generateJson(fullPrompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            onGenerate={handleGenerate}
            renderOutput={renderRecipeFusionChefOutput}
        />
    );
};

export default RecipeFusionChef;
