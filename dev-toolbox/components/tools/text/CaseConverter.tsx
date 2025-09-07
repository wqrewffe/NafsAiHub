
import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { useToolTelemetry } from '../../common/useToolTelemetry';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Card } from '../../common/Card';

const toSentenceCase = (str: string) => {
    if (!str) return '';
    return str.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
};

const toTitleCase = (str: string) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export const CaseConverter: React.FC = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    const handleConvert = (conversionType: string) => {
        let result = '';
        switch (conversionType) {
            case 'uppercase':
                result = input.toUpperCase();
                break;
            case 'lowercase':
                result = input.toLowerCase();
                break;
            case 'sentencecase':
                result = toSentenceCase(input);
                break;
            case 'titlecase':
                result = toTitleCase(input);
                break;
        }
        setOutput(result);
        try { recordUsage(conversionType, result); } catch (e) { }
    };

    const recordUsage = useToolTelemetry('case-converter', 'Case Converter', 'Text');

    return (
        <ToolContainer>
            <ToolHeader
                title="Case Converter"
                description="Convert text to UPPERCASE, lowercase, Sentence case, or Title Case."
            />
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Textarea
                        placeholder="Enter text here..."
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
            </Card>
            <div className="flex flex-wrap gap-2">
                <Button onClick={() => handleConvert('uppercase')}>UPPERCASE</Button>
                <Button onClick={() => handleConvert('lowercase')}>lowercase</Button>
                <Button onClick={() => handleConvert('sentencecase')}>Sentence case</Button>
                <Button onClick={() => handleConvert('titlecase')}>Title Case</Button>
                 <Button onClick={() => { setInput(''); setOutput(''); }} variant="secondary">Clear</Button>
            </div>
        </ToolContainer>
    );
};
