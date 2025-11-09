import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

const encodeEntities = (str: string): string => {
    const element = document.createElement('div');
    element.innerText = str;
    return element.innerHTML;
};

const decodeEntities = (str: string): string => {
    const element = document.createElement('textarea');
    element.innerHTML = str;
    return element.value;
};

export const HtmlEntityConverter: React.FC = () => {
    const [input, setInput] = useState('<p>This is a "test" & it\'s great!</p>');
    const [output, setOutput] = useState('');
    const [isCopied, copy] = useCopyToClipboard();

    const handleEncode = () => setOutput(encodeEntities(input));
    const handleDecode = () => setOutput(decodeEntities(input));

    return (
        <ToolContainer>
            <ToolHeader
                title="HTML Entity Converter"
                description="Encode or decode special characters to their corresponding HTML entities."
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                    placeholder="Enter HTML or text..."
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
                        className="bg-slate-800/50"
                    />
                    {output && <Button onClick={() => copy(output)} className="absolute top-2 right-2 px-3 py-1 text-xs" variant="secondary">{isCopied ? 'Copied!' : 'Copy'}</Button>}
                </div>
            </div>
             <div className="flex flex-wrap gap-2">
                <Button onClick={handleEncode}>Encode</Button>
                <Button onClick={handleDecode}>Decode</Button>
                <Button onClick={() => { setInput(''); setOutput(''); }} variant="secondary">Clear</Button>
            </div>
        </ToolContainer>
    );
};
