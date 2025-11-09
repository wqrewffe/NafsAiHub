
import React from 'react';
import ToolContainer from './common/ToolContainer';
import type { ToolOptionConfig } from '../types';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { FireIcon } from './Icons';
import { languageOptions } from './common/options';

interface RecipeOutput {
    recipeName: string;
    description: string;
    prepTime: string;
    cookTime: string;
    servings: string;
    ingredients: string[];
    instructions: string[];
}

export const renderRecipeCreatorOutput = (output: RecipeOutput | string) => {
    let data: RecipeOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.recipeName || !Array.isArray(data.ingredients)) {
        return <p className="text-red-400">Could not generate a valid recipe. Please try different ingredients.</p>;
    }
    return (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg">
            <div className="text-center mb-6">
                <FireIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-3xl font-bold text-light">{data.recipeName}</h2>
                <p className="text-slate-400 mt-2 italic">"{data.description}"</p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-center mb-6 border-y border-slate-700 py-4">
                <div className="flex-1 min-w-[120px]">
                    <p className="text-sm text-slate-400">Prep Time</p>
                    <p className="font-bold text-light">{data.prepTime}</p>
                </div>
                <div className="flex-1 min-w-[120px]">
                    <p className="text-sm text-slate-400">Cook Time</p>
                    <p className="font-bold text-light">{data.cookTime}</p>
                </div>
                <div className="flex-1 min-w-[120px]">
                    <p className="text-sm text-slate-400">Servings</p>
                    <p className="font-bold text-light">{data.servings}</p>
                </div>
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

const RecipeCreator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'recipe-creator')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'cuisine',
            label: 'Cuisine Style',
            type: 'select',
            defaultValue: 'Any',
            options: [
                { value: 'Any', label: 'Any' },
                { value: 'Italian', label: 'Italian' },
                { value: 'Mexican', label: 'Mexican' },
                { value: 'Asian Fusion', label: 'Asian Fusion' },
                { value: 'American', label: 'American' },
                { value: 'Mediterranean', label: 'Mediterranean' },
            ]
        },
        {
            name: 'diet',
            label: 'Dietary Preference',
            type: 'select',
            defaultValue: 'None',
            options: [
                { value: 'None', label: 'None' },
                { value: 'Vegetarian', label: 'Vegetarian' },
                { value: 'Vegan', label: 'Vegan' },
                { value: 'Gluten-Free', label: 'Gluten-Free' },
            ]
        },
         {
            name: 'skillLevel',
            label: 'Skill Level',
            type: 'select',
            defaultValue: 'Intermediate',
            options: [
                { value: 'Beginner', label: 'Beginner' },
                { value: 'Intermediate', label: 'Intermediate' },
                { value: 'Advanced', label: 'Advanced' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            recipeName: { type: GenAiType.STRING, description: "A creative name for the recipe." },
            description: { type: GenAiType.STRING, description: "A brief, appetizing description of the dish." },
            prepTime: { type: GenAiType.STRING, description: "Estimated preparation time (e.g., '15 minutes')." },
            cookTime: { type: GenAiType.STRING, description: "Estimated cooking time (e.g., '25 minutes')." },
            servings: { type: GenAiType.STRING, description: "Number of servings the recipe makes (e.g., '4 servings')." },
            ingredients: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "A list of ingredients with quantities." },
            instructions: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "A list of step-by-step cooking instructions." },
        },
        required: ['recipeName', 'description', 'prepTime', 'cookTime', 'servings', 'ingredients', 'instructions'],
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any; image?: { mimeType: string; data: string } }) => {
        const { cuisine, diet, language, skillLevel } = options;
        const cuisineInstruction = cuisine === 'Any' ? '' : ` The recipe should have a ${cuisine} style.`;
        const dietInstruction = diet === 'None' ? '' : ` It must adhere to a ${diet} diet.`;

        const fullPrompt = `I have the following ingredients: "${prompt}". Based on these, create a delicious recipe suitable for a cook with a '${skillLevel}' skill level.${cuisineInstruction}${dietInstruction} Provide a recipe name, a short description, prep time, cook time, number of servings, a list of ingredients (including any common pantry items you might add), and step-by-step instructions. The entire response must be in ${language}.`;
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
            renderOutput={renderRecipeCreatorOutput}
        />
    );
};

export default RecipeCreator;