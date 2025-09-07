import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

export const DuplicateLineRemover: React.FC = () => {
    const [input, setInput] = useState('Apple\nBanana\nApple\nOrange\nBanana\nApple');
    const [isCaseSensitive, setIsCaseSensitive] = useState(false);
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    const { output, linesRemoved } = useMemo(() => {
    const lines: string[] = input.split('\n');
    let uniqueLines: string[];

        if (isCaseSensitive) {
            uniqueLines = Array.from(new Set(lines));
        } else {
            const seen = new Set<string>();
            uniqueLines = lines.filter(line => {
                const lowerLine = line.toLowerCase();
                if (seen.has(lowerLine)) {
                    return false;
                }
                seen.add(lowerLine);
                return true;
            });
        }

        return {
            output: uniqueLines.join('\n'),
            linesRemoved: lines.length - uniqueLines.length,
        };
    }, [input, isCaseSensitive]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Duplicate Line Remover"
                description="Remove duplicate lines from a block of text."
            />
            <Card>
                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={isCaseSensitive}
                        onChange={e => setIsCaseSensitive(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Case Sensitive</span>
                </label>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                    placeholder="Paste text with duplicate lines here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={12}
                />
                <div className="relative">
                    <Textarea
                        placeholder="Unique lines..."
                        value={output}
                        readOnly
                        rows={12}
                        className="bg-slate-800/50"
                    />
                    <div className="absolute top-2 right-14 text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                        {linesRemoved} line(s) removed
                    </div>
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
