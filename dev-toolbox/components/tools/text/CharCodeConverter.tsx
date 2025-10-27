import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Select } from '../../common/Select';
import { Card } from '../../common/Card';

type Mode = 'text' | 'ascii' | 'hex' | 'binary';

const textToAscii = (text: string) => text.split('').map(c => c.charCodeAt(0)).join(' ');
const asciiToText = (ascii: string) => ascii.split(' ').map(c => String.fromCharCode(parseInt(c, 10))).join('');

const textToHex = (text: string) => text.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
const hexToText = (hex: string) => hex.split(' ').map(c => String.fromCharCode(parseInt(c, 16))).join('');

const textToBinary = (text: string) => text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
const binaryToText = (binary: string) => binary.split(' ').map(c => String.fromCharCode(parseInt(c, 2))).join('');

export const CharCodeConverter: React.FC = () => {
    const [input, setInput] = useState('Dev Toolbox!');
    const [output, setOutput] = useState('');
    const [fromMode, setFromMode] = useState<Mode>('text');
    const [toMode, setToMode] = useState<Mode>('ascii');
    const [error, setError] = useState('');
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    const handleConvert = () => {
        try {
            setError('');
            if (!input.trim()) {
                setOutput('');
                return;
            }

            let textValue = '';
            // First, convert input to plain text
            switch (fromMode) {
                case 'text': textValue = input; break;
                case 'ascii': textValue = asciiToText(input); break;
                case 'hex': textValue = hexToText(input); break;
                case 'binary': textValue = binaryToText(input); break;
            }

            // Then, convert from plain text to the target format
            let result = '';
            switch (toMode) {
                case 'text': result = textValue; break;
                case 'ascii': result = textToAscii(textValue); break;
                case 'hex': result = textToHex(textValue); break;
                case 'binary': result = textToBinary(textValue); break;
            }
            setOutput(result);
        } catch (e) {
            setError('Invalid input for the selected "From" format.');
            setOutput('');
        }
    };

    const handleSwap = () => {
        const tempInput = input;
        setInput(output);
        setOutput(tempInput);
        setFromMode(toMode);
        setToMode(fromMode);
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="Character Code Converter"
                description="Convert text to and from ASCII, Hex, and Binary representations."
            />
            <Card>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Select value={fromMode} onChange={e => setFromMode(e.target.value as Mode)}>
                        <option value="text">From Text</option>
                        <option value="ascii">From ASCII</option>
                        <option value="hex">From Hex</option>
                        <option value="binary">From Binary</option>
                    </Select>
                     <Button variant="secondary" onClick={handleSwap} className="px-3 py-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h18m-7.5-12L21 9m0 0l-4.5 4.5M21 9H3" /></svg>
                    </Button>
                    <Select value={toMode} onChange={e => setToMode(e.target.value as Mode)}>
                        <option value="text">To Text</option>
                        <option value="ascii">To ASCII</option>
                        <option value="hex">To Hex</option>
                        <option value="binary">To Binary</option>
                    </Select>
                </div>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                    placeholder={`Enter ${fromMode} here...`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={10}
                    className="font-mono"
                />
                <div className="relative">
                    <Textarea
                        placeholder={`Result in ${toMode}...`}
                        value={output}
                        readOnly
                        rows={10}
                        className="bg-slate-800/50 font-mono"
                    />
                    {output && (
                         <Button
                            onClick={() => copyToClipboard(output)}
                            className="absolute top-2 right-2 px-3 py-1 text-xs"
                            variant="secondary"
                        >
                            {isCopied ? 'Copied!' : 'Copy'}
                        </Button>
                    )}
                </div>
            </div>
            {error && <p className="text-red-400 text-center -mt-2">{error}</p>}
            <Button onClick={handleConvert} className="w-full">Convert</Button>
        </ToolContainer>
    );
};
