import React, { useState } from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { MapIcon, ChevronDownIcon, ChevronRightIcon } from './Icons';

interface Module {
    module: number;
    title: string;
    topics: string[];
    project: string;
}

interface LearningPathOutput {
    skill: string;
    level: string;
    path: Module[];
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
    ]
};

const LearningPathOutputView: React.FC<{ output: LearningPathOutput | string }> = ({ output }) => {
    const [openModule, setOpenModule] = useState<number | null>(1);

    const toggleModule = (module: number) => {
        setOpenModule(openModule === module ? null : module);
    };

    let data: LearningPathOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.path) || data.path.length === 0) {
        return <p className="text-red-400">Could not generate a learning path. Please specify your learning goal clearly.</p>;
    }

    return (
        <div className="space-y-4">
            <div className="text-center mb-6">
                <MapIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Your Learning Path for {data.skill}</h2>
                <p className="text-slate-400">({data.level} Level)</p>
            </div>
            <div className="space-y-2">
                {data.path.map((mod) => (
                    <div key={mod.module} className="border border-slate-700 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleModule(mod.module)}
                            className="w-full flex justify-between items-center p-4 bg-secondary hover:bg-slate-700 transition-colors"
                        >
                            <div className="text-left">
                                <p className="font-semibold text-light">Module {mod.module}: {mod.title}</p>
                            </div>
                            {openModule === mod.module
                                ? <ChevronDownIcon className="h-6 w-6 text-slate-400" />
                                : <ChevronRightIcon className="h-6 w-6 text-slate-400" />}
                        </button>
                        {openModule === mod.module && (
                            <div className="p-4 bg-primary space-y-3">
                                <div>
                                    <h4 className="font-semibold text-accent">Topics to Cover:</h4>
                                    <ul className="list-disc list-inside pl-4 text-slate-300">
                                        {mod.topics.map((topic, i) => <li key={i}>{topic}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-accent">Practical Project:</h4>
                                    <p className="text-slate-300">{mod.project}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const LearningPathGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'learning-path-generator')!;
    
    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'numModules',
            label: 'Number of Modules',
            type: 'number',
            defaultValue: 5,
            min: 3,
            max: 8,
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            skill: { type: GenAiType.STRING },
            level: { type: GenAiType.STRING },
            path: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        module: { type: GenAiType.NUMBER },
                        title: { type: GenAiType.STRING },
                        topics: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING } },
                        project: { type: GenAiType.STRING, description: "A practical project for the module." }
                    },
                    required: ["module", "title", "topics", "project"]
                },
                description: "An array of learning modules."
            }
        },
        required: ["skill", "level", "path"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { numModules, language } = options;
        const fullPrompt = `Create a personalized learning path based on this request: "${prompt}". Identify the skill and user's level. Generate a structured syllabus with ${numModules} modules. For each module, provide a title, a list of key topics to cover, and a practical project to apply the skills. The entire response must be in ${language}.`;
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
            renderOutput={(output) => <LearningPathOutputView output={output} />}
        />
    );
};

export default LearningPathGenerator;
