import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { summarizeContent } from '../../../services/geminiService';

// Basic markdown to HTML renderer
const renderMarkdown = (text: string) => {
    return text.replace(/(\n|^)\* (.+)/g, '$1<li class="ml-4 list-disc">$2</li>');
};

export const AIContentSummarizer: React.FC = () => {
    const [content, setContent] = useState('');
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSummarize = async () => {
        if (!content.trim()) return;
        setIsLoading(true);
        setSummary('');
        const result = await summarizeContent(content);
        setSummary(result);
        setIsLoading(false);
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="AI Content Summarizer"
                description="Paste any long-form text to get a quick summary with key bullet points."
            />
            <Card>
                <h3 className="text-lg font-semibold text-white mb-2">Text to Summarize</h3>
                <Textarea
                    placeholder="Paste your article, report, or any long text here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={12}
                />
            </Card>
            <Button onClick={handleSummarize} disabled={isLoading || !content.trim()}>
                {isLoading ? 'Summarizing...' : 'Summarize'}
            </Button>
            {(isLoading || summary) && (
                <Card>
                     <h3 className="text-lg font-semibold text-white mb-2">Summary</h3>
                     {isLoading ? (
                        <Loader text="Distilling the key points..." />
                     ) : (
                        <div className="prose prose-invert prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }}></div>
                     )}
                </Card>
            )}
        </ToolContainer>
    );
};