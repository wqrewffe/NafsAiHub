import React from 'react';
import ToolContainer from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { GlobeAltIcon } from './Icons';

interface Headline {
    timeframe: "1 Year" | "5 Years" | "10 Years" | "20 Years";
    headline: string;
    summary: string;
}

interface FutureOutput {
    trend: string;
    headlines: Headline[];
}

export const renderFutureHeadlineGeneratorOutput = (output: FutureOutput | string) => {
    let data: FutureOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.headlines) || data.headlines.length < 4) {
        return <p className="text-red-400">Could not generate future headlines. Please describe a clearer trend.</p>;
    }
    return (
        <div className="space-y-6">
            <div className="text-center">
                <GlobeAltIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Future Headlines: <span className="text-accent">{data.trend}</span></h2>
            </div>
            <div className="space-y-4">
                {data.headlines.map((item, index) => (
                    <div key={index} className="bg-secondary p-4 rounded-lg">
                        <p className="text-sm font-bold text-sky-400">{item.timeframe} From Now</p>
                        <h3 className="text-xl font-semibold text-light mt-1">{item.headline}</h3>
                        <p className="text-slate-400 text-sm mt-1">{item.summary}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FutureHeadlineGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'future-headline-generator')!;

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            trend: { type: GenAiType.STRING },
            headlines: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        timeframe: { type: GenAiType.STRING, enum: ["1 Year", "5 Years", "10 Years", "20 Years"] },
                        headline: { type: GenAiType.STRING },
                        summary: { type: GenAiType.STRING, description: "A one-sentence summary of the imagined news story." }
                    },
                    required: ["timeframe", "headline", "summary"]
                },
                description: "An array of 4 headlines, one for each timeframe."
            }
        },
        required: ["trend", "headlines"]
    };

    const handleGenerate = async ({ prompt }: { prompt: string; options: Record<string, any> }) => {
        const fullPrompt = `Act as a futurist. Based on the current trend provided by the user, generate four plausible news headlines from the future. Create one headline for each of the following timeframes: 1 year, 5 years, 10 years, and 20 years from now. For each, provide the headline and a one-sentence summary.

        Current Trend: "${prompt}"`;
        return generateJson(fullPrompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            onGenerate={handleGenerate}
            renderOutput={renderFutureHeadlineGeneratorOutput}
        />
    );
};

export default FutureHeadlineGenerator;