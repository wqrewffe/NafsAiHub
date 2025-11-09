import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { generateDomainIdeas } from '../../../services/geminiService';

const DomainIdea: React.FC<{ domain: string }> = ({ domain }) => {
    const [isCopied, copyToClipboard] = useCopyToClipboard();
    return (
        <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
            <span className="font-mono text-white">{domain}</span>
            <div className="flex items-center gap-2">
                 <a href={`https://domains.google.com/registrar/search?searchTerm=${domain}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300">Check</a>
                <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => copyToClipboard(domain)}>
                    {isCopied ? 'Copied!' : 'Copy'}
                </Button>
            </div>
        </div>
    );
};


export const AIDomainIdeaGenerator: React.FC = () => {
    const [keywords, setKeywords] = useState('');
    const [domains, setDomains] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!keywords.trim()) return;
        setIsLoading(true);
        setDomains([]);
        const ideas = await generateDomainIdeas(keywords);
        setDomains(ideas);
        setIsLoading(false);
    };
    
    return (
        <ToolContainer>
            <ToolHeader
                title="AI Domain Idea Generator"
                description="Get creative, available-sounding domain name ideas for your next project."
            />
            <Card>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                        type="text"
                        placeholder="e.g., AI-powered analytics for SaaS"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        className="flex-grow"
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !keywords.trim()}>
                        {isLoading ? 'Generating...' : 'Generate Ideas'}
                    </Button>
                </div>
            </Card>

            {(isLoading || domains.length > 0) && (
                <Card>
                    <h3 className="text-lg font-semibold text-white mb-3">Suggested Domains</h3>
                    {isLoading ? (
                        <Loader text="Brainstorming domain names..." />
                    ) : (
                        <div className="space-y-2">
                           {domains.map(domain => 
                                domain.startsWith('Error:') 
                                    ? <p key="error" className="text-red-400">{domain}</p> 
                                    : <DomainIdea key={domain} domain={domain} />
                           )}
                        </div>
                    )}
                </Card>
            )}
        </ToolContainer>
    );
};