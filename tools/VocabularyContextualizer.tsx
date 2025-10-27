import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { ChatBubbleBottomCenterTextIcon } from './Icons';

interface Example {
    context: string;
    sentence: string;
}

interface VocabOutput {
    word: string;
    definition: string;
    examples: Example[];
    synonyms?: string[];
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

export const renderVocabularyContextualizerOutput = (output: VocabOutput | string) => {
    let data: VocabOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.word || !Array.isArray(data.examples)) {
        return <p className="text-red-400">Could not find that word. Please check the spelling.</p>;
    }
    return (
        <div className="space-y-6">
             <div className="bg-secondary p-6 rounded-lg text-center">
                <h2 className="text-4xl font-bold text-accent capitalize">{data.word}</h2>
                <p className="text-slate-300 mt-2">{data.definition}</p>
                 {data.synonyms && data.synonyms.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-600">
                        <p className="text-sm text-slate-400">Synonyms: <span className="text-slate-300 italic">{data.synonyms.join(', ')}</span></p>
                    </div>
                )}
            </div>
            <div>
                <h3 className="flex items-center text-xl font-semibold text-light mb-3">
                   <ChatBubbleBottomCenterTextIcon className="h-6 w-6 mr-2" />
                   Usage in Context
                </h3>
                <div className="space-y-3">
                    {data.examples.map((ex, index) => (
                        <div key={index} className="border-l-4 border-accent/50 pl-4 py-2 bg-primary/50">
                            <p className="font-semibold text-sm text-accent">{ex.context}</p>
                            <p className="text-slate-300 italic">"{ex.sentence}"</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const VocabularyContextualizer: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'vocabulary-contextualizer')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'includeSynonyms',
            label: 'Include Synonyms',
            type: 'select',
            defaultValue: 'No',
            options: [
                { value: 'Yes', label: 'Yes' },
                { value: 'No', label: 'No' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            word: { type: GenAiType.STRING },
            definition: { type: GenAiType.STRING },
            examples: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        context: { type: GenAiType.STRING, description: "The context of the example (e.g., 'Academic', 'Casual Conversation', 'Formal Writing')." },
                        sentence: { type: GenAiType.STRING, description: "An example sentence using the word." }
                    },
                    required: ["context", "sentence"]
                },
                description: "An array of 3 example sentences in different contexts."
            },
            synonyms: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "An optional list of 3-5 synonyms."}
        },
        required: ["word", "definition", "examples"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { language, includeSynonyms } = options;
        const synonymInstruction = includeSynonyms === 'Yes' ? 'Also provide a list of 3-5 synonyms.' : '';
        const fullPrompt = `Provide a detailed contextual explanation for the vocabulary word: "${prompt}". Give the word, its definition, and create 3 distinct example sentences, each in a different context (e.g., Academic, Casual Conversation, Formal Writing). ${synonymInstruction} The entire response must be in ${language}.`;
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
            renderOutput={renderVocabularyContextualizerOutput}
        />
    );
};

export default VocabularyContextualizer;