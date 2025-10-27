import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

export const JsonFormatter: React.FC = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    const handleFormat = () => {
        try {
            setError('');
            if (!input.trim()) {
                setOutput('');
                return;
            }
            const parsed = JSON.parse(input);
            const formatted = JSON.stringify(parsed, null, 4);
            setOutput(formatted);
        } catch (e) {
            if (e instanceof Error) {
                setError(`Invalid JSON: ${e.message}`);
            } else {
                setError('An unknown error occurred while parsing JSON.');
            }
            setOutput('');
        }
    };
    
    const handleMinify = () => {
         try {
            setError('');
             if (!input.trim()) {
                setOutput('');
                return;
            }
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            setOutput(minified);
        } catch (e) {
            if (e instanceof Error) {
                setError(`Invalid JSON: ${e.message}`);
            } else {
                setError('An unknown error occurred while parsing JSON.');
            }
            setOutput('');
        }
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="JSON Formatter & Validator"
                description="Prettify, minify, and validate your JSON data."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                    placeholder="Paste your JSON here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={15}
                    aria-label="JSON Input"
                />
                <div className="relative">
                    <Textarea
                        placeholder="Formatted JSON will appear here..."
                        value={output}
                        readOnly
                        rows={15}
                        className="bg-slate-800"
                        aria-label="JSON Output"
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
                <Button onClick={handleFormat}>Format / Prettify</Button>
                <Button onClick={handleMinify}>Minify</Button>
                <Button onClick={() => { setInput(''); setOutput(''); setError(''); }} variant="secondary">Clear</Button>
            </div>
        </ToolContainer>
    );
};
