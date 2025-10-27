import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Textarea } from '../../common/Textarea';
import { Select } from '../../common/Select';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Loader } from '../../common/Loader';

type Algorithm = 'SHA-256' | 'SHA-384' | 'SHA-512';

const generateHmac = async (algorithm: Algorithm, key: string, message: string): Promise<string> => {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(message);

    const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: algorithm },
        false,
        ['sign']
    );

    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const HmacGenerator: React.FC = () => {
    const [message, setMessage] = useState('Dev Toolbox');
    const [secret, setSecret] = useState('supersecretkey');
    const [algorithm, setAlgorithm] = useState<Algorithm>('SHA-256');
    const [hmac, setHmac] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, copy] = useCopyToClipboard();

    const handleGenerate = async () => {
        if (!message || !secret) return;
        setIsLoading(true);
        setHmac('');
        const result = await generateHmac(algorithm, secret, message);
        setHmac(result);
        setIsLoading(false);
    };

    return (
        <ToolContainer>
            <ToolHeader title="HMAC Generator" description="Generate a Hash-based Message Authentication Code (HMAC) using a secret key." />
            <Card className="space-y-4">
                <Textarea label="Message" value={message} onChange={e => setMessage(e.target.value)} rows={4} />
                <Input label="Secret Key" value={secret} onChange={e => setSecret(e.target.value)} className="font-mono"/>
                <Select label="Algorithm" value={algorithm} onChange={e => setAlgorithm(e.target.value as Algorithm)}>
                    <option>SHA-256</option>
                    <option>SHA-384</option>
                    <option>SHA-512</option>
                </Select>
            </Card>
            <Button onClick={handleGenerate} disabled={isLoading || !message || !secret} className="w-full">
                {isLoading ? 'Generating...' : 'Generate HMAC'}
            </Button>
            {(isLoading || hmac) && (
                <Card>
                    <h3 className="text-lg font-semibold text-white mb-2">Result</h3>
                    {isLoading ? <Loader /> : (
                         <div className="relative">
                            <Input readOnly value={hmac} className="font-mono bg-slate-800/50 pr-20" />
                            <Button onClick={() => copy(hmac)} className="absolute right-2 top-1/2 -translate-y-1/2" variant="secondary">{isCopied ? 'Copied!' : 'Copy'}</Button>
                        </div>
                    )}
                </Card>
            )}
        </ToolContainer>
    );
};