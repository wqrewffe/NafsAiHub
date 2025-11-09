import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { generateBlogPostIdeas } from '../../../services/geminiService';

const IdeaItem: React.FC<{ text: string }> = ({ text }) => {
    const [isCopied, copy] = useCopyToClipboard();
    return (
        <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
            <span className="text-white">{text}</span>
            <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => copy(text)}>
                {isCopied ? 'Copied!' : 'Copy'}
            </Button>
        </div>
    );
};

export const AIBlogPostIdeaGenerator: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [ideas, setIdeas] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        setIdeas([]);
        const results = await generateBlogPostIdeas(topic);
        setIdeas(results);
        setIsLoading(false);
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="AI Blog Post Idea Generator"
                description="Get engaging blog post ideas and titles for any topic."
            />
            <Card>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                        type="text"
                        placeholder="e.g., 'React performance optimization'"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="flex-grow"
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !topic.trim()}>
                        {isLoading ? 'Generating...' : 'Generate Ideas'}
                    </Button>
                </div>
            </Card>

            {(isLoading || ideas.length > 0) && (
                <Card>
                    <h3 className="text-lg font-semibold text-white mb-3">Generated Ideas</h3>
                    {isLoading ? (
                        <Loader text="Brainstorming ideas..." />
                    ) : (
                        <div className="space-y-2">
                           {ideas.map((idea, index) => 
                                idea.startsWith('Error:') 
                                    ? <p key="error" className="text-red-400">{idea}</p> 
                                    : <IdeaItem key={index} text={idea} />
                           )}
                        </div>
                    )}
                </Card>
            )}
        </ToolContainer>
    );
};