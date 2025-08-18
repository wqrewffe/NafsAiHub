import React, { useState } from 'react';
import ToolContainer from './common/ToolContainer';
import type { ToolOptionConfig } from '../../types';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { MapPinIcon, ChevronDownIcon, ChevronRightIcon } from './Icons';
import { languageOptions } from './common/options';

interface Activity {
    time: string;
    description: string;
}

interface ItineraryDay {
    day: number;
    title: string;
    activities: Activity[];
}

interface ItineraryOutput {
    location: string;
    duration: string;
    itinerary: ItineraryDay[];
}

export const renderTravelItineraryPlannerOutput = (output: ItineraryOutput | string) => {
    const [openDay, setOpenDay] = useState<number | null>(1);

    const toggleDay = (day: number) => {
        setOpenDay(openDay === day ? null : day);
    };
    
    let data: ItineraryOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.itinerary) || data.itinerary.length === 0) {
        return <p className="text-red-400">Could not generate an itinerary. Please be more specific about your destination and duration.</p>;
    }
    return (
        <div className="space-y-4">
            <div className="text-center mb-6">
                <MapPinIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Your Trip to {data.location}</h2>
                <p className="text-slate-400">{data.duration} Itinerary</p>
            </div>
            <div className="space-y-2">
                {data.itinerary.map((day) => (
                    <div key={day.day} className="border border-slate-700 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleDay(day.day)}
                            className="w-full flex justify-between items-center p-4 bg-secondary hover:bg-slate-700 transition-colors"
                            aria-expanded={openDay === day.day}
                        >
                            <div className="flex items-center">
                                <span className="bg-accent text-primary font-bold rounded-md h-8 w-8 text-center flex items-center justify-center mr-4">
                                    {day.day}
                                </span>
                                <div>
                                    <p className="font-semibold text-light text-left">Day {day.day}: {day.title}</p>
                                </div>
                            </div>
                            {openDay === day.day ? <ChevronDownIcon className="h-6 w-6 text-slate-400" /> : <ChevronRightIcon className="h-6 w-6 text-slate-400" />}
                        </button>
                        {openDay === day.day && (
                            <div className="p-4 bg-primary space-y-3">
                                {day.activities.map((activity, index) => (
                                    <div key={index} className="flex items-start">
                                        <p className="w-24 text-right pr-4 font-semibold text-accent flex-shrink-0">{activity.time}</p>
                                        <div className="border-l border-slate-600 pl-4 flex-1">
                                            <p className="text-slate-300">{activity.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const TravelItineraryPlanner: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'travel-itinerary-planner')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'pace',
            label: 'Travel Pace',
            type: 'select',
            defaultValue: 'Moderate',
            options: [
                { value: 'Relaxed', label: 'Relaxed' },
                { value: 'Moderate', label: 'Moderate' },
                { value: 'Packed', label: 'Packed' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            location: { type: GenAiType.STRING },
            duration: { type: GenAiType.STRING },
            itinerary: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        day: { type: GenAiType.NUMBER },
                        title: { type: GenAiType.STRING, description: "A title for the day's theme (e.g., 'Historical Center & Museums')." },
                        activities: {
                            type: GenAiType.ARRAY,
                            items: {
                                type: GenAiType.OBJECT,
                                properties: {
                                    time: { type: GenAiType.STRING, description: "e.g., 'Morning', 'Afternoon', '9:00 AM'" },
                                    description: { type: GenAiType.STRING }
                                },
                                required: ["time", "description"]
                            }
                        }
                    },
                    required: ["day", "title", "activities"]
                }
            }
        },
        required: ["location", "duration", "itinerary"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any; image?: { mimeType: string; data: string } }) => {
        const { language, pace } = options;
        const fullPrompt = `Create a day-by-day travel itinerary based on the user's request. The pace should be '${pace}'. Identify the location and duration. For each day, provide a title/theme and a list of activities with suggested times (e.g., Morning, Afternoon, Evening). The entire response must be in ${language}.

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
            renderOutput={renderTravelItineraryPlannerOutput}
        />
    );
};

export default TravelItineraryPlanner;
