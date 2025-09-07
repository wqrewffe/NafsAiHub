import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { generateHashtags } from '../../../services/geminiService';

export const AIHashtagGenerator: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [hashtags, setHashtags] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        setHashtags('');
        const result = await generateHashtags(topic);
        setHashtags(result);
        setIsLoading(false);
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="AI Hashtag Generator"
                description="Generate relevant and trending hashtags for your social media posts."
            />
            <Card>
                <h3 className="text-lg font-semibold text-white mb-2">Post Topic</h3>
                <Textarea
                    placeholder="e.g., A new open-source JavaScript library for animations"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    rows={3}
                />
            </Card>
            <Button onClick={handleGenerate} disabled={isLoading || !topic.trim()}>
                {isLoading ? 'Generating...' : 'Generate Hashtags'}
            </Button>
            {(isLoading || hashtags) && (
                <Card>
                     <h3 className="text-lg font-semibold text-white mb-2">Generated Hashtags</h3>
                     {isLoading ? (
                        <Loader text="Finding the best hashtags..." />
                     ) : (
                        <div className="relative">
                            <Textarea
                                value={hashtags}
                                readOnly
                                rows={4}
                                className="bg-slate-800"
                            />
                            <Button
                                onClick={() => copyToClipboard(hashtags)}
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