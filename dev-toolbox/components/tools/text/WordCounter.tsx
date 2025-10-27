
import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Card } from '../../common/Card';

export const WordCounter: React.FC = () => {
    const [text, setText] = useState('');

    const stats = useMemo(() => {
        if (!text.trim()) {
            return { words: 0, characters: 0, sentences: 0, paragraphs: 0 };
        }

        const characters = text.length;
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        const sentences = text.match(/[\w|\)][.?!](\s|$)/g)?.length || 0;
        const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0).length;

        return { words, characters, sentences, paragraphs };
    }, [text]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Word Counter"
                description="Count words, characters, sentences, and paragraphs in your text."
            />
            <Textarea
                placeholder="Start typing or paste your text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-white">{stats.words}</p>
                    <p className="text-slate-400">Words</p>
                </Card>
                <Card className="text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-white">{stats.characters}</p>
                    <p className="text-slate-400">Characters</p>
                </Card>
                <Card className="text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-white">{stats.sentences}</p>
                    <p className="text-slate-400">Sentences</p>
                </Card>
                <Card className="text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-white">{stats.paragraphs}</p>
                    <p className="text-slate-400">Paragraphs</p>
                </Card>
            </div>
        </ToolContainer>
    );
};
