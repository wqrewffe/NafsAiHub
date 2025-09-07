import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

const HASH_ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

async function generateHash(algorithm: string, text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const HashGenerator: React.FC = () => {
    const [input, setInput] = useState('');
    const [hashes, setHashes] = useState<Record<string, string>>({});
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    const handleGenerate = async () => {
        if (!input) {
            setHashes({});
            return;
        }
        const newHashes: Record<string, string> = {};
        for (const alg of HASH_ALGORITHMS) {
            newHashes[alg] = await generateHash(alg, input);
        }
        setHashes(newHashes);
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="Hash Generator"
                description="Generate SHA hashes from your text input."
            />
            <Textarea
                placeholder="Enter text here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={8}
            />
            <Button onClick={handleGenerate} disabled={!input}>Generate Hashes</Button>
            
            {Object.keys(hashes).length > 0 && (
                <div className="space-y-4">
                    {HASH_ALGORITHMS.map(alg => (
                        <Card key={alg}>
                            <h3 className="text-lg font-semibold text-white">{alg}</h3>
                            <div className="relative mt-2 bg-slate-900 rounded-md p-3 font-mono text-sm text-slate-300 break-all">
                                {hashes[alg]}
                                <Button onClick={() => copyToClipboard(hashes[alg])} variant="secondary" className="absolute top-2 right-2 px-2 py-1 text-xs">{isCopied ? 'Copied' : 'Copy'}</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </ToolContainer>
    );
};
