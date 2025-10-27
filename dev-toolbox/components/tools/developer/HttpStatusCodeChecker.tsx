import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Loader } from '../../common/Loader';
import { inspectUrl, InspectionResult } from '../../../services/captureService';
import { Select } from '../../common/Select';
import { Textarea } from '../../common/Textarea';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'HEAD';

interface Header {
    id: number;
    key: string;
    value: string;
}

const getStatusColor = (status: number) => {
    if (status >= 500) return 'text-red-400 border-red-400/30 bg-red-500/10';
    if (status >= 400) return 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10';
    if (status >= 300) return 'text-blue-400 border-blue-400/30 bg-blue-500/10';
    if (status >= 200) return 'text-green-400 border-green-400/30 bg-green-500/10';
    return 'text-slate-400 border-slate-400/30 bg-slate-500/10';
};

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const prettyPrintJson = (jsonString: string): string => {
    try {
        return JSON.stringify(JSON.parse(jsonString), null, 2);
    } catch (e) {
        return jsonString;
    }
};

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left text-lg font-semibold text-white mb-2">
                {title}
                <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
            {isOpen && children}
        </div>
    );
};

export const HttpStatusCodeChecker: React.FC = () => {
    // Request state
    const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
    const [method, setMethod] = useState<HttpMethod>('GET');
    const [headers, setHeaders] = useState<Header[]>([{id: 1, key: 'Accept', value: 'application/json'}]);
    const [body, setBody] = useState('');
    
    // Response state
    const [result, setResult] = useState<InspectionResult | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isBodyCopied, copyBody] = useCopyToClipboard();

    const handleInspect = async () => {
        if (!url) return;
        setIsLoading(true);
        setError('');
        setResult(null);
        try {
            const headersObject = headers.reduce((acc, h) => {
                if (h.key) acc[h.key] = h.value;
                return acc;
            }, {} as Record<string, string>);

            const res = await inspectUrl(url, method, headersObject, body);
            setResult(res);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const addHeader = () => setHeaders([...headers, {id: Date.now(), key: '', value: ''}]);
    const updateHeader = (id: number, field: 'key' | 'value', value: string) => {
        setHeaders(headers.map(h => h.id === id ? {...h, [field]: value} : h));
    };
    const removeHeader = (id: number) => setHeaders(headers.filter(h => h.id !== id));

    return (
        <ToolContainer>
            <ToolHeader
                title="HTTP Inspector"
                description="Inspect HTTP requests with custom methods, headers, and bodies."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="space-y-4">
                     <h3 className="text-lg font-semibold text-white">Request Configuration</h3>
                    <div>
                        <label className="text-sm">URL</label>
                        <Input type="url" value={url} onChange={e => setUrl(e.target.value)} />
                    </div>
                     <div>
                        <label className="text-sm">Method</label>
                        <Select value={method} onChange={e => setMethod(e.target.value as HttpMethod)}>
                            <option>GET</option><option>POST</option><option>PUT</option><option>HEAD</option>
                        </Select>
                    </div>
                    <div>
                        <label className="text-sm">Headers</label>
                        <div className="space-y-2">
                        {headers.map(h => (
                            <div key={h.id} className="flex gap-2 items-center">
                                <Input placeholder="Key" value={h.key} onChange={e => updateHeader(h.id, 'key', e.target.value)} className="font-mono text-sm" />
                                <Input placeholder="Value" value={h.value} onChange={e => updateHeader(h.id, 'value', e.target.value)} className="font-mono text-sm" />
                                <Button variant="danger" onClick={() => removeHeader(h.id)} className="p-2 h-9 w-9 flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
                                </Button>
                            </div>
                        ))}
                        </div>
                        <Button variant="secondary" onClick={addHeader} className="mt-2 text-sm w-full">Add Header</Button>
                    </div>
                    {(method === 'POST' || method === 'PUT') && <div>
                        <label className="text-sm">Body</label>
                        <Textarea value={body} onChange={e => setBody(e.target.value)} rows={5} className="font-mono text-sm" />
                    </div>}
                    <Button onClick={handleInspect} disabled={isLoading || !url} className="w-full">
                        {isLoading ? 'Inspecting...' : 'Inspect'}
                    </Button>
                </Card>

                <div className="space-y-4">
                    {isLoading && <Card className="flex justify-center"><Loader text="Fetching response..." /></Card>}
                    {error && <Card><p className="text-red-400 text-center">{error}</p></Card>}
                    {result && (
                        <Card className="space-y-6">
                            <div className={`text-center p-4 border rounded-lg ${getStatusColor(result.status)}`}>
                                <p className="text-6xl font-bold">{result.status}</p>
                                <p className="text-2xl mt-1">{result.statusText}</p>
                            </div>
                            {result.url.toLowerCase() !== url.toLowerCase() && (
                                <div className="text-sm text-center text-blue-300 bg-blue-500/10 p-2 rounded-md">
                                    Redirected from <br/> <code className="break-all">{url}</code>
                                </div>
                            )}
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div><p className="text-xl font-bold">{result.duration}ms</p><p className="text-sm text-slate-400">Duration</p></div>
                                <div><p className="text-xl font-bold">{formatBytes(result.size)}</p><p className="text-sm text-slate-400">Size</p></div>
                                <div><p className="text-xl font-bold">{Object.keys(result.headers).length}</p><p className="text-sm text-slate-400">Headers</p></div>
                            </div>
                            <CollapsibleSection title="Response Headers">
                                <div className="font-mono text-xs space-y-2 bg-slate-800/50 p-3 rounded-md">
                                {Object.entries(result.headers).map(([key, value]) => (
                                    <p key={key} className="break-all"><span className="text-indigo-400">{key}:</span> <span className="text-slate-300">{value}</span></p>
                                ))}
                                </div>
                            </CollapsibleSection>
                             <CollapsibleSection title="Response Body">
                                <div className="relative">
                                    <pre className="text-xs bg-slate-800/50 p-3 rounded-md whitespace-pre-wrap break-all max-h-60 overflow-auto">
                                        <code>{prettyPrintJson(result.body)}</code>
                                    </pre>
                                     <Button variant="secondary" onClick={() => copyBody(prettyPrintJson(result.body))} className="absolute top-2 right-2 text-xs px-2 py-1">
                                        {isBodyCopied ? 'Copied!' : 'Copy'}
                                    </Button>
                                </div>
                            </CollapsibleSection>
                        </Card>
                    )}
                </div>
            </div>
        </ToolContainer>
    );
};