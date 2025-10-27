import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateJson, GenAiType } from '../services/geminiService';
import { tools } from './index';
import { BookmarkSquareIcon } from './Icons';

interface Recommendation {
    title: string;
    author: string;
    genre: string;
    synopsis: string;
    reason: string;
}

interface BookOutput {
    recommendations: Recommendation[];
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

export const renderBookRecommenderOutput = (output: BookOutput | string) => {
    let data: BookOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.recommendations) || data.recommendations.length === 0) {
        return <p className="text-red-400">Could not generate recommendations. Please try different genres or authors.</p>;
    }
    return (
        <div className="space-y-6">
             <h3 className="text-xl font-bold text-light mb-4">Your Next Reads:</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.recommendations.map((book, index) => (
                    <div key={index} className="bg-secondary rounded-lg overflow-hidden shadow-lg border border-slate-700 flex flex-col">
                       <div className="p-4 bg-primary">
                         <h3 className="text-xl font-bold text-light h-16">{book.title}</h3>
                         <p className="text-slate-400">by {book.author}</p>
                       </div>
                       <div className="p-4 flex-grow flex flex-col justify-between">
                         <div>
                           <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-sky-300 bg-sky-800/50 mb-3">
                            {book.genre}
                           </span>
                           <p className="text-sm text-slate-300 mb-4">{book.synopsis}</p>
                         </div>
                         <div className="mt-4 pt-3 border-t border-slate-600">
                            <p className="text-sm text-slate-400 italic">"{book.reason}"</p>
                        </div>
                       </div>
                    </div>
                ))}
             </div>
        </div>
    );
};

const BookRecommender: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'book-recommender')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'mood',
            label: 'Desired Mood',
            type: 'select',
            defaultValue: 'Thought-Provoking',
            options: [
                { value: 'Uplifting', label: 'Uplifting' },
                { value: 'Thought-Provoking', label: 'Thought-Provoking' },
                { value: 'Fast-Paced', label: 'Fast-Paced' },
                { value: 'Mysterious', label: 'Mysterious' },
            ]
        },
        languageOptions
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            recommendations: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        title: { type: GenAiType.STRING },
                        author: { type: GenAiType.STRING },
                        genre: { type: GenAiType.STRING },
                        synopsis: { type: GenAiType.STRING, description: "A short, engaging summary of the book's plot." },
                        reason: { type: GenAiType.STRING, description: "Why this book is a good recommendation for the user." },
                    },
                    required: ['title', 'author', 'genre', 'synopsis', 'reason'],
                },
                description: "An array of 3 book recommendations."
            },
        },
        required: ['recommendations'],
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { language, mood } = options;
        const fullPrompt = `Recommend 3 books based on the following preferences: "${prompt}". The recommendations should fit a '${mood}' mood. For each book, provide the title, author, genre, a brief synopsis, and a short reason for the recommendation. The entire response must be in ${language}. (Note: The book titles and author names should remain in their original language).`;
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
            renderOutput={renderBookRecommenderOutput}
        />
    );
};

export default BookRecommender;