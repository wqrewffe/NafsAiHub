import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Loader } from '../../common/Loader';
import { scanSecurityHeaders } from '../../../services/reconService';

type Result = { present: boolean; value?: string };

const ResultRow: React.FC<{ header: string; result: Result }> = ({ header, result }) => {
    const statusColor = result.present ? 'text-green-400' : 'text-red-400';
    return (
        <div className="py-3 border-b border-slate-800 last:border-b-0">
            <div className="flex justify-between items-center">
                <span className="font-mono text-white">{header}</span>
                <span className={`font-bold ${statusColor}`}>{result.present ? 'Present' : 'Missing'}</span>
            </div>
            {result.value && <p className="font-mono text-xs text-slate-400 mt-1 break-all">{result.value}</p>}
        </div>
    );
};

export const SecurityHeaderScanner: React.FC = () => {
    const [url, setUrl] = useState('https://google.com');
    const [results, setResults] = useState<Record<string, Result> | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleScan = async () => {
        if (!url) return;
        setIsLoading(true);
        setResults(null);
        const data = await scanSecurityHeaders(url);
        setResults(data);
        setIsLoading(false);
    };

    return (
        <ToolContainer>
            <ToolHeader title="Security Header Scanner" description="Check a website's HTTP response for important security headers." />
            <Card>
                 <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                        type="url"
                        placeholder="https://example.com"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleScan()}
                    />
                    <Button onClick={handleScan} disabled={isLoading || !url}>
                        {isLoading ? 'Scanning...' : 'Scan'}
                    </Button>
                </div>
            </Card>
            {isLoading && <Card><Loader /></Card>}
            {results && (
                <Card>
                    {Object.entries(results).map(([header, result]) => (
                        <ResultRow key={header} header={header} result={result} />
                    ))}
                </Card>
            )}
        </ToolContainer>
    );
};
