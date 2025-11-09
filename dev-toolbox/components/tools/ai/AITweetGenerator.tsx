import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { generateTweet } from '../../../services/geminiService';
import { useToolTelemetry } from '../../common/useToolTelemetry';

export const AITweetGenerator: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [tweet, setTweet] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, copyToClipboard] = useCopyToClipboard();
    const recordUsage = useToolTelemetry('ai-tweet-generator', 'AI Tweet Generator', 'AI');

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        setTweet('');
    const result = await generateTweet(topic);
    setTweet(result);
    // record telemetry
    try { await recordUsage(topic, result); } catch (e) { /* swallow */ }
        setIsLoading(false);
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="AI Tweet Generator"
                description="Generate a viral-style tweet about any topic."
            />
            <Card>
                <h3 className="text-lg font-semibold text-white mb-2">Topic</h3>
                <Textarea
                    placeholder="e.g., The future of frontend development"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    rows={3}
                />
            </Card>
            <Button onClick={handleGenerate} disabled={isLoading || !topic.trim()}>
                {isLoading ? 'Generating...' : 'Generate Tweet'}
            </Button>
            {(isLoading || tweet) && (
                <Card>
                     <h3 className="text-lg font-semibold text-white mb-2">Generated Tweet</h3>
                     {isLoading ? (
                        <Loader text="Crafting the perfect tweet..." />
                     ) : (
                        <div className="relative">
                            <Textarea
                                value={tweet}
                                readOnly
                                rows={5}
                                className="bg-slate-800"
                            />
                            <Button
                                onClick={() => copyToClipboard(tweet)}
                                className="absolute top-2 right-2 px-3 py-1 text-xs"
                                variant="secondary"
                            >
                                {isCopied ? 'Copied!' : 'Copy'}
                            </Button>
                        </div>
                     )}
                </Card>
            )}
        </ToolContainer>
    );
};