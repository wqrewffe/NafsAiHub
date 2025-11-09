import React from 'react';
import ToolContainer, { ToolOptionConfig } from '../common/ToolContainer';
import { generateJson, GenAiType } from '../../services/geminiService';
import { tools } from '../index';
import { PencilSquareIcon } from '../Icons';

interface FoodReviewOutput {
    foodName: string;
    source: string;
    rating: number;
    review: string;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
    const totalStars = 5;
    return (
        <div className="flex">
            {[...Array(totalStars)].map((_, index) => (
                <svg key={index} className={`h-6 w-6 ${index < rating ? 'text-amber-400' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
};

export const renderFictionalFoodCriticOutput = (output: FoodReviewOutput | string) => {
    let data: FoodReviewOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.foodName) {
        return <p className="text-red-400">Could not review this food. Please be more specific.</p>;
    }

    return (
        <div className="bg-secondary p-6 rounded-lg border border-slate-700 space-y-4">
            <div className="border-b border-slate-600 pb-4">
                <h2 className="text-2xl font-bold text-light">{data.foodName}</h2>
                <p className="text-slate-400 text-sm">from {data.source}</p>
                <div className="mt-2">
                    <StarRating rating={data.rating} />
                </div>
            </div>
            <div className="prose prose-invert prose-p:text-slate-300 max-w-none">
                <p className="whitespace-pre-wrap">{data.review}</p>
            </div>
        </div>
    );
};

const FictionalFoodCritic: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'fictional-food-critic')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'personality',
            label: "Critic's Personality",
            type: 'select',
            defaultValue: 'Snobby & Pretentious',
            options: [
                { value: 'Snobby & Pretentious', label: 'Snobby & Pretentious' },
                { value: 'Enthusiastic & Over-the-top', label: 'Enthusiastic & Over-the-top' },
                { value: 'Grumpy & Hard-to-please', label: 'Grumpy & Hard-to-please' },
            ]
        }
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            foodName: { type: GenAiType.STRING },
            source: { type: GenAiType.STRING },
            rating: { type: GenAiType.NUMBER, description: "A rating from 1 to 5." },
            review: { type: GenAiType.STRING, description: "The full review from the critic's perspective." }
        },
        required: ["foodName", "source", "rating", "review"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { personality } = options;
        const fullPrompt = `Write a food critic review for the fictional food: "${prompt}". Adopt the persona of a "${personality}" critic. Provide the food name, its source (e.g., 'Harry Potter'), a star rating out of 5, and the full review.`;
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
            renderOutput={renderFictionalFoodCriticOutput}
        />
    );
};

export default FictionalFoodCritic;
