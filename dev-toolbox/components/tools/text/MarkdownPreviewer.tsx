import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Card } from '../../common/Card';

const parseMarkdown = (markdown: string) => {
    let html = markdown;
    // Headers
    html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
    html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    // Bold
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
    // Lists
    html = html.replace(/^\s*[-*] (.*)/gim, '<ul><li>$1</li></ul>');
    html = html.replace(/<\/ul>\n<ul>/gim, ''); // Combine adjacent list items
    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:underline">$1</a>');
    // Paragraphs
    html = html.replace(/\n/g, '<br />');

    return html;
};


export const MarkdownPreviewer: React.FC = () => {
    const [markdown, setMarkdown] = useState(`# Hello, Markdown!

This is a **live preview** of some basic Markdown.

- List item 1
- List item 2

You can even include [links](https://www.google.com).`);

    const renderedHtml = useMemo(() => parseMarkdown(markdown), [markdown]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Markdown Previewer"
                description="Write Markdown on the left and see the rendered HTML on the right."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                    placeholder="Type your Markdown here..."
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    rows={20}
                    className="font-mono"
                />
                <Card className="prose prose-invert prose-slate max-w-none">
                     <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
                </Card>
            </div>
        </ToolContainer>
    );
};
