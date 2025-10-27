import React from 'react';
import ToolContainer, { ToolOptionConfig } from '../common/ToolContainer';
import { generateJson, GenAiType } from '../../services/geminiService';
import { tools } from '../index';
import { LightBulbIcon } from '../Icons';

interface ProjectIdea {
    title: string;
    problem: string;
    dataset: string;
    metric: string;
}

export const renderAIProjectIdeaGeneratorOutput = (output: ProjectIdea | string) => {
    let data: ProjectIdea;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.title) {
        return <p className="text-red-400">Could not generate a project idea. Please try a different theme.</p>;
    }

    return (
        <div className="bg-secondary p-6 rounded-lg border border-slate-700 space-y-4">
            <div className="text-center border-b border-slate-600 pb-3">
                <LightBulbIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">{data.title}</h2>
            </div>
            <div>
                <h3 className="font-semibold text-accent">Problem Statement</h3>
                <p className="text-slate-300 mt-1">{data.problem}</p>
            </div>
             <div>
                <h3 className="font-semibold text-accent">Suggested Dataset</h3>
                <p className="text-slate-300 mt-1">{data.dataset}</p>
            </div>
             <div>
                <h3 className="font-semibold text-accent">Success Metric</h3>
                <p className="text-slate-300 mt-1">{data.metric}</p>
            </div>
        </div>
    );
};

const AIProjectIdeaGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'ai-project-idea-generator')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'difficulty',
            label: 'Project Difficulty',
            type: 'select',
            defaultValue: 'Intermediate',
            options: [
                { value: 'Beginner', label: 'Beginner' },
                { value: 'Intermediate', label: 'Intermediate' },
                { value: 'Advanced', label: 'Advanced' },
            ]
        }
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            title: { type: GenAiType.STRING },
            problem: { type: GenAiType.STRING, description: "A clear problem the project aims to solve." },
            dataset: { type: GenAiType.STRING, description: "A suggestion for where to find or how to create a suitable dataset." },
            metric: { type: GenAiType.STRING, description: "How success would be measured (e.g., 'Achieve >95% accuracy')." }
        },
        required: ["title", "problem", "dataset", "metric"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { difficulty } = options;
        const fullPrompt = `Brainstorm a novel AI/ML project idea of ${difficulty} difficulty related to the theme: "${prompt}". Provide a project title, a clear problem statement, a suggestion for a dataset, and a primary success metric.`;
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
            renderOutput={renderAIProjectIdeaGeneratorOutput}
        />
    );
};

export default AIProjectIdeaGenerator;
