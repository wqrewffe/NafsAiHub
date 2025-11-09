import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Card } from '../../common/Card';

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <Card className="text-center">
        <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
        <p className="text-slate-400 text-sm">{label}</p>
    </Card>
);

export const TextStatistics: React.FC = () => {
    const [text, setText] = useState('');

    const stats = useMemo(() => {
        if (!text.trim()) {
            return {
                words: 0,
                characters: 0,
                sentences: 0,
                paragraphs: 0,
                readingTime: '0s',
                avgWordLength: 0,
            };
        }

        const characters = text.length;
        const words = text.trim().split(/\s+/).filter(Boolean);
        const wordCount = words.length;
        const sentences = text.match(/[\w|\)][.?!](\s|$)/g)?.length || 1;
        const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0).length || 1;

        const totalWordLength = words.reduce((acc, word) => acc + word.length, 0);
        const avgWordLength = wordCount > 0 ? (totalWordLength / wordCount).toFixed(2) : 0;
        
        const readingTimeSeconds = Math.round((wordCount / 200) * 60); // Assuming 200 WPM
        const readingTime = readingTimeSeconds < 60 
            ? `${readingTimeSeconds}s` 
            : `${Math.floor(readingTimeSeconds / 60)}m ${readingTimeSeconds % 60}s`;

        return {
            words: wordCount,
            characters,
            sentences,
            paragraphs,
            readingTime,
            avgWordLength,
        };
    }, [text]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Text Statistics"
                description="Get detailed statistics about your text, including reading time and average word length."
            />
            <Textarea
                placeholder="Start typing or paste your text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Words" value={stats.words} />
                <StatCard label="Characters" value={stats.characters} />
                <StatCard label="Sentences" value={stats.sentences} />
                <StatCard label="Paragraphs" value={stats.paragraphs} />
                <StatCard label="Average Word Length" value={stats.avgWordLength} />
                <StatCard label="Estimated Reading Time" value={stats.readingTime} />
            </div>
        </ToolContainer>
    );
};
