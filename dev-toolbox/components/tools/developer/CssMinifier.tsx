import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Button } from '../../common/Button';

const minifyCss = (css: string): string => {
    return css
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ')           // Collapse whitespace
        .replace(/ ?([{:;]) ?/g, '$1')  // Remove space around braces and semicolons
        .trim();
};

export const CssMinifier: React.FC = () => {
    const [input, setInput] = useState(`/* Example CSS */
body {
    font-family: sans-serif;
    line-height: 1.5;
    background-color: #f0f0f0;
}`);
    const [isCopied, copy] = useCopyToClipboard();

    const { output, originalSize, minifiedSize, savings } = useMemo(() => {
        const minified = minifyCss(input);
        const original = new Blob([input]).size;
        const min = new Blob([minified]).size;
        const saved = original > 0 ? (((original - min) / original) * 100).toFixed(1) : 0;
        return {
            output: minified,
            originalSize: original,
            minifiedSize: min,
            savings: saved,
        };
    }, [input]);

    return (
        <ToolContainer>
            <ToolHeader
                title="CSS Minifier"
                description="Reduce the file size of your CSS by removing comments and extra whitespace."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                    placeholder="Paste your CSS here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                />
                <div className="relative">
                    <Textarea
                        placeholder="Minified CSS..."
                        value={output}
                        readOnly
                        rows={15}
                        className="bg-slate-800/50 font-mono text-sm"
                    />
                    <Button onClick={() => copy(output)} className="absolute top-2 right-2 px-3 py-1 text-xs" variant="secondary">
                        {isCopied ? 'Copied!' : 'Copy'}
                    </Button>
                     <div className="absolute bottom-2 right-2 text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                        Savings: {savings}%
                    </div>
                </div>
            </div>
        </ToolContainer>
    );
};
