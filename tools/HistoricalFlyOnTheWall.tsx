
import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { PencilIcon } from './Icons';

interface NarrativeOutput {
    event: string;
    date: string;
    perspective: string;
    narrative: string;
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
    ]
};

export const renderHistoricalFlyOnTheWallOutput = (output: NarrativeOutput | string) => {
    let data: NarrativeOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.narrative) {
        return <p className="text-red-400">Could not generate a narrative for this event. Please try another.</p>;
    }
    return (
        <div className="bg-yellow-50/80 p-4 sm:p-6 rounded-md border border-amber-800/20 shadow-xl font-serif text-slate-800">
            <div className="text-center border-b-2 border-dashed border-amber-800/30 pb-4 mb-6">
                <PencilIcon className="h-8 w-8 mx-auto text-amber-900 mb-2" />
                <h2 className="text-2xl font-bold text-amber-900">{data.event}</h2>
                <p className="text-sm text-amber-800/80">{data.date}</p>
                <p className="text-sm italic text-amber-800/80">As witnessed by: {data.perspective}</p>
            </div>
            <div className="prose prose-p:text-slate-700 prose-p:leading-relaxed max-w-none text-justify">
                {data.narrative.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 indent-8">{paragraph}</p>
                ))}
            </div>
        </div>
    );
};

const HistoricalFlyOnTheWall: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'historical-fly-on-the-wall')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'length',
            label: 'Narrative Length',
            type: 'select',
            defaultValue: 'Short (~200 words)',
            options: [
                { value: 'Short (~200 words)', label: 'Short' },
                { value: 'Medium (~400 words)', label: 'Medium' },
                { value: 'Long (~600 words)', label: 'Long' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            event: { type: GenAiType.STRING },
            date: { type: GenAiType.STRING },
            perspective: { type: GenAiType.STRING, description: "e.g., 'A stonemason watching the pyramids being built'" },
            narrative: { type: GenAiType.STRING, description: "A first-person, present-tense narrative." }
        },
        required: ["event", "date", "perspective", "narrative"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { length, language } = options;
        const fullPrompt = `Generate a "fly on the wall" historical narrative. Based on the user's request, create a vivid, first-person, present-tense story of ${length} from the perspective of an ordinary, anonymous person witnessing the event. Describe the sights, sounds, smells, and atmosphere. Identify the event, date, and the perspective you'vechosen. The entire response must be in ${language}.

        User Request: "${prompt}"`;
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
            renderOutput={renderHistoricalFlyOnTheWallOutput}
        />
    );
};

export default HistoricalFlyOnTheWall;
