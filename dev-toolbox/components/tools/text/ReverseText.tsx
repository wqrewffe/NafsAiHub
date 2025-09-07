import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Card } from '../../common/Card';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Button } from '../../common/Button';

type ReverseMode = 'all' | 'lines';

export const ReverseText: React.FC = () => {
    const [input, setInput] = useState('Hello World\nLine two');
    const [mode, setMode] = useState<ReverseMode>('all');
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    const output = useMemo(() => {
        if (mode === 'all') {
            return input.split('').reverse().join('');
        } else {
            return input.split('\n').map(line => line.split('').reverse().join('')).join('\n');
        }
    }, [input, mode]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Reverse Text"
                description="Reverse an entire block of text or reverse each line individually."
            />
            <Card>
                <div className="flex gap-2">
                    <Button onClick={() => setMode('all')} variant={mode === 'all' ? 'primary' : 'secondary'}>Reverse Entire Text</Button>
                    <Button onClick={() => setMode('lines')} variant={mode === 'lines' ? 'primary' : 'secondary'}>Reverse Each Line</Button>
                </div>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                    placeholder="Enter text..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={10}
                />
                <div className="relative">
                    <Textarea
                        placeholder="Reversed text..."
                        value={output}
                        readOnly
                        rows={10}
                        className="bg-slate-800/50"
                    />
                     <Button
                        onClick={() => copyToClipboard(output)}
                        className="absolute top-2 right-2 px-3 py-1 text-xs"
                        variant="secondary"
                    >
                        {isCopied ? 'Copied!' : 'Copy'}
                    </Button>
                </div>
            </div>
        </ToolContainer>
    );
};
