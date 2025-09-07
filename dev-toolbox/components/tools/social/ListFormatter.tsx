import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Card } from '../../common/Card';
import { Select } from '../../common/Select';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Button } from '../../common/Button';

type FormatType = 'bullet-disc' | 'bullet-circle' | 'bullet-square' | 'numbered' | 'alpha-lower' | 'alpha-upper';

export const ListFormatter: React.FC = () => {
    const [input, setInput] = useState('First item\nSecond item\nThird item');
    const [format, setFormat] = useState<FormatType>('bullet-disc');
    const [isCopied, copy] = useCopyToClipboard();

    const output = useMemo(() => {
        const lines = input.split('\n').filter(line => line.trim() !== '');
        return lines.map((line, index) => {
            switch (format) {
                case 'bullet-disc': return `• ${line}`;
                case 'bullet-circle': return `◦ ${line}`;
                case 'bullet-square': return `▪ ${line}`;
                case 'numbered': return `${index + 1}. ${line}`;
                case 'alpha-lower': return `${String.fromCharCode(97 + index)}. ${line}`;
                case 'alpha-upper': return `${String.fromCharCode(65 + index)}. ${line}`;
                default: return line;
            }
        }).join('\n');
    }, [input, format]);

    return (
        <ToolContainer>
            <ToolHeader
                title="List Formatter"
                description="Quickly add bullet points or numbering to your lists."
            />
            <Card>
                <Select value={format} onChange={e => setFormat(e.target.value as FormatType)}>
                    <option value="bullet-disc">Bullet Points (•)</option>
                    <option value="bullet-circle">Bullet Points (◦)</option>
                    <option value="bullet-square">Bullet Points (▪)</option>
                    <option value="numbered">Numbered (1, 2, 3)</option>
                    <option value="alpha-lower">Alphabetical (a, b, c)</option>
                    <option value="alpha-upper">Alphabetical (A, B, C)</option>
                </Select>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                    placeholder="Enter list items, one per line..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={10}
                />
                <div className="relative">
                    <Textarea
                        placeholder="Formatted list..."
                        value={output}
                        readOnly
                        rows={10}
                        className="bg-slate-800/50"
                    />
                    <Button onClick={() => copy(output)} className="absolute top-2 right-2 px-3 py-1 text-xs" variant="secondary">
                        {isCopied ? 'Copied!' : 'Copy'}
                    </Button>
                </div>
            </div>
        </ToolContainer>
    );
};
