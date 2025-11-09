import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Card } from '../../common/Card';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Button } from '../../common/Button';

interface TocItem {
    level: number;
    text: string;
    id: string;
}

const generateToc = (text: string): TocItem[] => {
    const lines = text.split('\n');
    const toc: TocItem[] = [];
    const idSet = new Set<string>();

    const createUniqueId = (text: string): string => {
        let baseId = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
        let newId = baseId;
        let counter = 2;
        while (idSet.has(newId)) {
            newId = `${baseId}-${counter++}`;
        }
        idSet.add(newId);
        return newId;
    };

    lines.forEach(line => {
        const match = line.match(/^(#{1,6})\s+(.*)/); // Markdown headers
        if (match) {
            const level = match[1].length;
            const text = match[2];
            toc.push({ level, text, id: createUniqueId(text) });
        }
    });

    return toc;
};

const TocList: React.FC<{ items: TocItem[] }> = ({ items }) => (
    <ul>
        {items.map(item => (
            <li key={item.id} style={{ marginLeft: `${(item.level - 1) * 20}px` }}>
                <a href={`#${item.id}`} className="text-indigo-400 hover:underline">{item.text}</a>
            </li>
        ))}
    </ul>
);

export const TocGenerator: React.FC = () => {
    const [input, setInput] = useState(`# Main Title
Some content here.

## Section 1
More content.

### Subsection 1.1
Details.

## Section 2
Final content.`);
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    const tocItems = useMemo(() => generateToc(input), [input]);
    
    const tocMarkdown = useMemo(() => {
        return tocItems.map(item => `${'  '.repeat(item.level - 1)}- [${item.text}](#${item.id})`).join('\n');
    }, [tocItems]);


    return (
        <ToolContainer>
            <ToolHeader
                title="Table of Contents Generator"
                description="Paste text with Markdown headers (e.g., #, ##) to generate a table of contents."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Textarea
                    placeholder="Paste your content with headers here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={20}
                    className="font-mono"
                />
                <div className="space-y-4">
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Preview</h3>
                        <div className="p-4 bg-slate-900 rounded-md">
                            {tocItems.length > 0 ? <TocList items={tocItems} /> : <p className="text-slate-500">No headers found.</p>}
                        </div>
                    </Card>
                    <Card className="relative">
                        <h3 className="text-lg font-semibold text-white mb-2">Markdown Output</h3>
                        <Textarea
                            value={tocMarkdown}
                            readOnly
                            rows={5}
                            className="bg-slate-900 font-mono"
                        />
                         <Button
                            onClick={() => copyToClipboard(tocMarkdown)}
                            className="absolute top-2 right-2 px-3 py-1 text-sm"
                            variant="secondary"
                        >
                            {isCopied ? 'Copied!' : 'Copy'}
                        </Button>
                    </Card>
                </div>
            </div>
        </ToolContainer>
    );
};
