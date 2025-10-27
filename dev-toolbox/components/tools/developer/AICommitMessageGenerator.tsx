import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { generateCommitMessage } from '../../../services/geminiService';
import { useToolTelemetry } from '../../common/useToolTelemetry';

export const CommitMessageGenerator: React.FC = () => {
    const [diff, setDiff] = useState('');
    const [commitMessage, setCommitMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    const handleGenerate = async () => {
        if (!diff.trim()) return;
        setIsLoading(true);
        setCommitMessage('');
        const message = await generateCommitMessage(diff);
        setCommitMessage(message);
        try { await recordUsage(diff, message); } catch (e) { }
        setIsLoading(false);
    };

    const recordUsage = useToolTelemetry('ai-commit-generator', 'AI Commit Message Generator', 'AI');

    return (
        <ToolContainer>
            <ToolHeader
                title="Commit Message Generator"
                description="Paste your git diff below to generate a conventional commit message."
            />
            <Card>
                <h3 className="text-lg font-semibold text-white mb-2">Git Diff</h3>
                <Textarea
                    placeholder="Paste git diff output here..."
                    value={diff}
                    onChange={(e) => setDiff(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                />
            </Card>
            <Button onClick={handleGenerate} disabled={isLoading || !diff.trim()}>
                {isLoading ? 'Generating...' : 'Generate Commit Message'}
            </Button>
            {(isLoading || commitMessage) && (
                <Card>
                     <h3 className="text-lg font-semibold text-white mb-2">Generated Message</h3>
                     {isLoading ? (
                        <Loader text="Analyzing diff and writing message..." />
                     ) : (
                        <div className="relative">
                            <Textarea
                                value={commitMessage}
                                readOnly
                                rows={4}
                                className="bg-slate-800"
                            />
                            <Button
                                onClick={() => copyToClipboard(commitMessage)}
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