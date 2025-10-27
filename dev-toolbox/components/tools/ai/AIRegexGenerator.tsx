import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { generateRegex } from '../../../services/geminiService';
import { Input } from '../../common/Input';

export const AIRegexGenerator: React.FC = () => {
    const [description, setDescription] = useState('');
    const [regex, setRegex] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    const handleGenerate = async () => {
        if (!description.trim()) return;
        setIsLoading(true);
        setRegex('');
        const result = await generateRegex(description);
        setRegex(result);
        setIsLoading(false);
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="AI Regex Generator"
                description="Describe the pattern you want to match in plain English, and let AI generate the regex for you."
            />
            <Card>
                <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                <Textarea
                    placeholder="e.g., 'match a valid email address' or 'find all URLs starting with https'"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                />
            </Card>
            <Button onClick={handleGenerate} disabled={isLoading || !description.trim()}>
                {isLoading ? 'Generating...' : 'Generate Regex'}
            </Button>
            {(isLoading || regex) && (
                <Card>
                     <h3 className="text-lg font-semibold text-white mb-2">Generated Regex Pattern</h3>
                     {isLoading ? (
                        <Loader text="Thinking up a clever pattern..." />
                     ) : (
                        <div className="relative">
                            <Input
                                value={regex}
                                readOnly
                                className="bg-slate-800 font-mono"
                            />
                            <Button
                                onClick={() => copyToClipboard(regex)}
                                className="absolute top-1/2 right-2 -translate-y-1/2 px-3 py-1 text-xs"
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