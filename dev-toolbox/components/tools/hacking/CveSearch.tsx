import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Loader } from '../../common/Loader';
import { searchCve } from '../../../services/reconService';

export const CveSearch: React.FC = () => {
    const [cveId, setCveId] = useState('CVE-2021-44228');
    const [result, setResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async () => {
        if (!cveId) return;
        setIsLoading(true);
        setResult(null);
        const data = await searchCve(cveId);
        setResult(data);
        setIsLoading(false);
    };

    return (
        <ToolContainer>
            <ToolHeader title="CVE Search" description="Look up vulnerability information from the Common Vulnerabilities and Exposures (CVE) database." />
            <Card>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                        placeholder="CVE-YYYY-NNNNN"
                        value={cveId}
                        onChange={e => setCveId(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={isLoading || !cveId}>
                        {isLoading ? 'Searching...' : 'Search'}
                    </Button>
                </div>
            </Card>
            {isLoading && <Card><Loader /></Card>}
            {result && (
                <Card>
                    {result.error ? (
                        <p className="text-red-400 text-center">{result.error}</p>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-white">{result.id}</h3>
                            <p className="text-slate-300">{result.summary}</p>
                            <div className="flex gap-4 text-center">
                                <div className="p-3 bg-slate-800 rounded-lg flex-1">
                                    <p className="text-sm text-slate-400">CVSS Score</p>
                                    <p className="text-xl font-bold text-white">{result.cvss || 'N/A'}</p>
                                </div>
                                <div className="p-3 bg-slate-800 rounded-lg flex-1">
                                    <p className="text-sm text-slate-400">Published</p>
                                    <p className="text-xl font-bold text-white">{new Date(result.Published).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-white">References:</h4>
                                <ul className="list-disc list-inside text-sm text-indigo-400 space-y-1 mt-2">
                                    {result.references?.map((ref: string, i: number) => (
                                        <li key={i}><a href={ref} target="_blank" rel="noopener noreferrer" className="hover:underline break-all">{ref}</a></li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </Card>
            )}
        </ToolContainer>
    );
};
