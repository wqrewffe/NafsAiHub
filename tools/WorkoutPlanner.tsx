import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';

interface Exercise {
    name: string;
    sets_reps: string;
}

interface DayPlan {
    day: string;
    focus: string;
    exercises: Exercise[];
    is_rest_day: boolean;
}

interface WorkoutOutput {
    plan: DayPlan[];
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
        { value: 'Mandarin Chinese', label: 'Mandarin Chinese' },
        { value: 'Hindi', label: 'Hindi' },
        { value: 'Arabic', label: 'Arabic' },
        { value: 'Portuguese', label: 'Portuguese' },
        { value: 'Bengali', label: 'Bengali (Bangla)' },
        { value: 'Russian', label: 'Russian' },
    ]
};

export const renderWorkoutPlannerOutput = (output: WorkoutOutput | string) => {
    let data: WorkoutOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.plan) || data.plan.length !== 7) {
        return <p className="text-red-400">Could not generate a valid 7-day plan. Please try again.</p>;
    }
    return (
        <div className="space-y-4">
             <h3 className="text-xl font-bold text-light mb-4">Your 7-Day Fitness Plan</h3>
             <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.plan.map((dayPlan, index) => (
                    <div key={index} className={`rounded-lg p-4 flex flex-col ${dayPlan.is_rest_day ? 'bg-slate-700' : 'bg-secondary'}`}>
                        <div className="font-bold text-lg text-accent">{dayPlan.day}</div>
                        <div className="text-sm text-slate-400 mb-3">{dayPlan.focus}</div>
                        <div className="flex-grow">
                            {dayPlan.is_rest_day ? (
                                <div className="flex items-center justify-center h-full text-slate-300">
                                    <p>Rest & Recover</p>
                                </div>
                            ) : (
                                <ul className="space-y-2 text-sm">
                                    {dayPlan.exercises.map((ex, i) => (
                                        <li key={i} className="flex justify-between p-2 bg-primary/50 rounded-md">
                                            <span className="text-slate-300 font-medium">{ex.name}</span>
                                            <span className="text-slate-400">{ex.sets_reps}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                ))}
             </div>
        </div>
    );
};

const WorkoutPlanner: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'workout-planner')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'planFocus',
            label: 'Plan Focus',
            type: 'select',
            defaultValue: 'General Fitness',
            options: [
                { value: 'General Fitness', label: 'General Fitness' },
                { value: 'Strength Training', label: 'Strength Training' },
                { value: 'Cardio & Endurance', label: 'Cardio & Endurance' },
                { value: 'Flexibility & Mobility', label: 'Flexibility & Mobility' },
                { value: 'Bodyweight Only', label: 'Bodyweight Only' },
            ]
        },
        {
            name: 'equipment',
            label: 'Available Equipment',
            type: 'select',
            defaultValue: 'Full Gym',
            options: [
                { value: 'Full Gym', label: 'Full Gym' },
                { value: 'Dumbbells Only', label: 'Dumbbells Only' },
                { value: 'No Equipment', label: 'No Equipment' },
            ]
        },
        languageOptions,
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            plan: {
                type: GenAiType.ARRAY,
                description: "A 7-day workout plan.",
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        day: { type: GenAiType.STRING, description: "The day of the week (e.g., 'Monday')." },
                        focus: { type: GenAiType.STRING, description: "The focus of the workout (e.g., 'Upper Body Strength', 'Cardio & Core', 'Rest Day')." },
                        is_rest_day: { type: GenAiType.BOOLEAN, description: "True if this is a rest day, false otherwise." },
                        exercises: {
                            type: GenAiType.ARRAY,
                            items: {
                                type: GenAiType.OBJECT,
                                properties: {
                                    name: { type: GenAiType.STRING },
                                    sets_reps: { type: GenAiType.STRING, description: "The sets and reps for the exercise (e.g., '3 sets of 10-12 reps')." },
                                },
                                required: ['name', 'sets_reps'],
                            },
                        },
                    },
                    required: ['day', 'focus', 'is_rest_day', 'exercises'],
                }
            },
        },
        required: ['plan'],
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { planFocus, equipment, language } = options;
        const fullPrompt = `Create a comprehensive 7-day workout plan based on these user goals: "${prompt}". The overall focus of the plan should be on ${planFocus}. The exercises should be suitable for someone with access to '${equipment}'. For each day of the week, specify the workout focus (or if it's a rest day) and list specific exercises with their sets and reps. Ensure the plan is balanced and logical. The response must be in ${language}.`;
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
            renderOutput={renderWorkoutPlannerOutput}
        />
    );
};

export default WorkoutPlanner;