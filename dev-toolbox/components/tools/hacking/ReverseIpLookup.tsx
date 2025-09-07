import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Loader } from '../../common/Loader';
import { reverseIpLookup } from '../../../services/reconService';

export const ReverseIpLookup: React.FC = () => {
    const [ip, setIp] = useState('8.8.8.8');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLookup = async () => {
        if (!ip) return;
        setIsLoading(true);
        setResult('');
        const data = await reverseIpLookup(ip);
        setResult(data);
        setIsLoading(false);
    };

    return (
        <ToolContainer>
            <ToolHeader title="Reverse IP Lookup" description="Find other domains hosted on the same IP address." />
            <Card>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                        placeholder="8.8.8.8"
                        value={ip}
                        onChange={e => setIp(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLookup()}
                    />
                    <Button onClick={handleLookup} disabled={isLoading || !ip}>
                        {isLoading ? 'Searching...' : 'Search'}
                    </Button>
                </div>
            </Card>
            {(isLoading || result) && (
                <Card>
                    {isLoading ? <Loader /> : (
                        <pre className="font-mono text-sm whitespace-pre-wrap break-all max-h-96 overflow-y-auto">
                            {result}
                        </pre>
                    )}
                </Card>
            )}
        </ToolContainer>
    );
};
