
import React, { useState, useEffect } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Loader } from '../../common/Loader';

export const IpAddress: React.FC = () => {
    const [ip, setIp] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    const fetchIp = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            if (!response.ok) throw new Error('Failed to fetch IP address.');
            const data = await response.json();
            setIp(data.ip);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchIp();
    }, []);

    return (
        <ToolContainer>
            <ToolHeader
                title="My IP Address"
                description="Find your public IP address."
            />
            <Card>
                {isLoading && <div className="min-h-[150px] flex items-center justify-center"><Loader text="Fetching IP Address..." /></div>}
                {error && <p className="text-red-400 text-center py-10">{error}</p>}
                {ip && !isLoading && (
                    <div className="text-center py-10">
                        <p className="text-slate-400 mb-2">Your Public IP Address is:</p>
                        <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-mono mb-6 break-all">{ip}</p>
                        <Button onClick={() => copyToClipboard(ip)}>
                            {isCopied ? 'Copied!' : 'Copy IP Address'}
                        </Button>
                    </div>
                )}
            </Card>
        </ToolContainer>
    );
};
