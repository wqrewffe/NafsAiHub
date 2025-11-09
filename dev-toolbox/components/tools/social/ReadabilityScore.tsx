import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Card } from '../../common/Card';

const countSyllables = (word: string): number => {
    word = word.toLowerCase();
    if (word.length <= 3) { return 1; }
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const match = word.match(/[aeiouy]{1,2}/g);
    return match ? match.length : 0;
};

const calculateReadability = (text: string) => {
    if (!text.trim()) {
        return { words: 0, sentences: 0, syllables: 0, fleschKincaid: 0 };
    }
    
    const words = text.trim().split(/\s+/).filter(Boolean);
    const sentences = text.match(/[\w|\)][.?!](\s|$)/g) || [];
    
    const wordCount = words.length;
    const sentenceCount = sentences.length || 1;
    const syllableCount = words.reduce((acc, word) => acc + countSyllables(word), 0);
    
    const fleschKincaid = 0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59;
    
    return {
        words: wordCount,
        sentences: sentenceCount,
        syllables: syllableCount,
        fleschKincaid: Math.max(0, parseFloat(fleschKincaid.toFixed(2))),
    };
};

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <Card className="text-center">
        <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
        <p className="text-slate-400">{label}</p>
    </Card>
);

export const ReadabilityScore: React.FC = () => {
    const [text, setText] = useState('The quick brown fox jumps over the lazy dog. This sentence is easy to read. Complex sentences with more syllables are harder to understand.');
    
    const stats = useMemo(() => calculateReadability(text), [text]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Text Readability Score"
                description="Analyze your text to calculate its readability and grade level."
            />
            <Textarea
                placeholder="Paste your text here..."
                value={text}
                onChange={e => setText(e.target.value)}
                rows={10}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Words" value={stats.words} />
                <StatCard label="Sentences" value={stats.sentences} />
                <StatCard label="Syllables" value={stats.syllables} />
                <StatCard label="Flesch-Kincaid Grade" value={stats.fleschKincaid} />
            </div>
             <Card>
                <h3 className="text-lg font-semibold text-white mb-2">About Flesch-Kincaid</h3>
                <p className="text-slate-400">The Flesch-Kincaid Grade Level score indicates the U.S. school grade level required to understand the text. For example, a score of 8.0 means that an eighth grader can understand the document. Most online content aims for a score between 7.0 and 9.0 for broad accessibility.</p>
            </Card>
        </ToolContainer>
    );
};
