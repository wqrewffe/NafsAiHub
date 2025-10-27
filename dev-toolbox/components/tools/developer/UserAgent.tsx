import React from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

export const UserAgent: React.FC = () => {
    const userAgent = navigator.userAgent;
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    return (
        <ToolContainer>
            <ToolHeader
                title="My User Agent"
                description="View your browser's user agent string."
            />
            <Card>
                <div className="relative">
                    <p className="font-mono text-slate-300 p-4 break-all bg-slate-900 rounded-md">
                        {userAgent}
                    </p>
                    <Button
                        onClick={() => copyToClipboard(userAgent)}
                        className="absolute top-2 right-2 px-3 py-1 text-sm"
                        variant="secondary"
                    >
                        {isCopied ? 'Copied!' : 'Copy'}
                    </Button>
                </div>
            </Card>
        </ToolContainer>
    );
};
