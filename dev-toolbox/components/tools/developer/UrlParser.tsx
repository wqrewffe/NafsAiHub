
import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Button } from '../../common/Button';

interface ParsedUrl {
    [key: string]: string | string[][];
}

const ResultRow: React.FC<{ label: string; value: string }> = ({ label, value }) => {
    const [isCopied, copy] = useCopyToClipboard();
    if (!value) return null;
    return (
        <div className="grid grid-cols-3 gap-4 items-center border-t border-slate-800 py-3">
            <dt className="text-sm font-medium text-slate-400">{label}</dt>
            <dd className="col-span-2 flex items-center justify-between">
                <span className="font-mono text-white break-all">{value}</span>
                <Button variant="ghost" onClick={() => copy(value)} className="px-2 py-1 text-xs">
                    {isCopied ? 'Copied' : 'Copy'}
                </Button>
            </dd>
        </div>
    );
};

export const UrlParser: React.FC = () => {
    const [urlInput, setUrlInput] = useState('https://www.example.com:8080/path/to/page?query=string&param2=value#section-2');
    const [error, setError] = useState('');

    const parsedUrl = useMemo<ParsedUrl | null>(() => {
        if (!urlInput.trim()) {
            setError('');
            return null;
        }
        try {
            const url = new URL(urlInput);
            const params: string[][] = [];
            url.searchParams.forEach((value, key) => {
                params.push([key, value]);
            });
            setError('');
            return {
                href: url.href,
                protocol: url.protocol,
                hostname: url.hostname,
                port: url.port,
                pathname: url.pathname,
                search: url.search,
                hash: url.hash,
                origin: url.origin,
                searchParams: params,
            };
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Invalid URL');
            return null;
        }
    }, [urlInput]);

    return (
        <ToolContainer>
            <ToolHeader
                title="URL Parser"
                description="Break down any URL into its components: protocol, host, path, query parameters, and more."
            />
            <Card>
                <Input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Enter a URL to parse"
                    className="font-mono"
                />
                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </Card>

            {parsedUrl && (
                <Card>
                    <dl className="divide-y divide-slate-800">
                        {Object.entries(parsedUrl).map(([key, value]) => {
                            if (key !== 'searchParams' && typeof value === 'string') {
                                return <ResultRow key={key} label={key} value={value} />;
                            }
                            return null;
                        })}
                    </dl>
                </Card>
            )}

            {parsedUrl && Array.isArray(parsedUrl.searchParams) && parsedUrl.searchParams.length > 0 && (
                 <Card>
                    <h3 className="text-lg font-semibold text-white mb-3">Query Parameters</h3>
                    <dl>
                        {(parsedUrl.searchParams as string[][]).map(([key, value], index) => (
                             <ResultRow key={`${key}-${index}`} label={key} value={value} />
                        ))}
                    </dl>
                 </Card>
            )}

        </ToolContainer>
    );
};
