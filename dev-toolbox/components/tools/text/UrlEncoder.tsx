import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

export const UrlEncoder: React.FC = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    const handleEncode = () => {
        setError('');
        setOutput(encodeURIComponent(input));
    };

    const handleDecode = () => {
        try {
            setError('');
            setOutput(decodeURIComponent(input));
        } catch (e) {
            setError('Could not decode URL. The input is not a valid encoded URI component.');
            setOutput('');
        }
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="URL Encoder / Decoder"
                description="Encode or decode strings to be URL-safe."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                    placeholder="Enter string to encode or decode..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={10}
                />
                <div className="relative">
                    <Textarea
                        placeholder="Result..."
                        value={output}
                        readOnly
                        rows={10}
                        className="bg-slate-800"
                    />
                    {output && (
                         <Button
                            onClick={() => copyToClipboard(output)}
                            className="absolute top-2 right-2 px-3 py-1 text-sm"
                            variant="secondary"
                        >
                            {isCopied ? 'Copied!' : 'Copy'}
                        </Button>
                    )}
                </div>
            </div>
            {error && <p className="text-red-400 text-center -mt-2">{error}</p>}
            <div className="flex flex-wrap gap-2">
                <Button onClick={handleEncode}>Encode</Button>
                <Button onClick={handleDecode}>Decode</Button>
                <Button onClick={() => { setInput(''); setOutput(''); setError(''); }} variant="secondary">Clear</Button>
            </div>
        </ToolContainer>
    );
};
