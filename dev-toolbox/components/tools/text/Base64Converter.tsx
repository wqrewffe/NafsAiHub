import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

export const Base64Converter: React.FC = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    const handleEncode = () => {
        try {
            setError('');
            setOutput(btoa(input));
        } catch (e) {
            setError('Could not encode text. Invalid characters may be present.');
            setOutput('');
        }
    };

    const handleDecode = () => {
        try {
            setError('');
            setOutput(atob(input));
        } catch (e) {
            setError('Could not decode Base64. The input is not a valid Base64 string.');
            setOutput('');
        }
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="Base64 Converter"
                description="Encode your text to Base64 or decode a Base64 string."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                    placeholder="Enter text or Base64 string..."
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
                <Button onClick={handleEncode}>Encode to Base64</Button>
                <Button onClick={handleDecode}>Decode from Base64</Button>
                <Button onClick={() => { setInput(''); setOutput(''); setError(''); }} variant="secondary">Clear</Button>
            </div>
        </ToolContainer>
    );
};
