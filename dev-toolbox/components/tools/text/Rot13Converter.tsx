import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Button } from '../../common/Button';

const rot13 = (str: string): string => {
  return str.replace(/[a-zA-Z]/g, (char) => {
    const start = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(start + (char.charCodeAt(0) - start + 13) % 26);
  });
};

export const Rot13Converter: React.FC = () => {
    const [input, setInput] = useState('Why did the chicken cross the road?');
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    const output = useMemo(() => rot13(input), [input]);

    return (
        <ToolContainer>
            <ToolHeader
                title="ROT13 Converter"
                description="Encode or decode text using the ROT13 substitution cipher."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                    placeholder="Enter text..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={10}
                />
                <div className="relative">
                    <Textarea
                        placeholder="ROT13 output..."
                        value={output}
                        readOnly
                        rows={10}
                        className="bg-slate-800/50"
                    />
                    <Button
                        onClick={() => copyToClipboard(output)}
                        className="absolute top-2 right-2 px-3 py-1 text-xs"
                        variant="secondary"
                    >
                        {isCopied ? 'Copied!' : 'Copy'}
                    </Button>
                </div>
            </div>
        </ToolContainer>
    );
};
