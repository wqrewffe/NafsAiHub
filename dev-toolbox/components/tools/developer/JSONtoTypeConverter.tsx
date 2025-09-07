import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Card } from '../../common/Card';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Button } from '../../common/Button';

const toPascalCase = (str: string) =>
    str.replace(/(\w)(\w*)/g, (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase())
       .replace(/[^a-zA-Z0-9]/g, '');

const jsonToTypescript = (json: any, rootName: string = 'RootObject'): string => {
    const interfaces = new Map<string, string>();

    function getType(value: any, keyName: string): string {
        if (value === null) return 'any';
        
        const type = typeof value;
        if (type === 'string') return 'string';
        if (type === 'number') return 'number';
        if (type === 'boolean') return 'boolean';

        if (Array.isArray(value)) {
            if (value.length === 0) return 'any[]';
            const arrayType = getType(value[0], keyName);
            return `${arrayType}[]`;
        }

        if (type === 'object') {
            const interfaceName = `I${toPascalCase(keyName)}`;
            if (!interfaces.has(interfaceName)) {
                // Placeholder to prevent infinite recursion
                interfaces.set(interfaceName, ''); 
                const props = Object.entries(value)
                    .map(([key, val]) => `  ${key}: ${getType(val, key)};`)
                    .join('\n');
                interfaces.set(interfaceName, `interface ${interfaceName} {\n${props}\n}`);
            }
            return interfaceName;
        }

        return 'any';
    }

    getType(json, rootName);

    // Ensure RootObject is defined, even if empty
    if (!interfaces.has(`I${rootName}`)) {
       interfaces.set(`I${rootName}`, `interface I${rootName} {}`);
    }

    return Array.from(interfaces.values()).filter(Boolean).join('\n\n');
};


export const JSONtoTypeConverter: React.FC = () => {
    const [jsonInput, setJsonInput] = useState('{\n  "id": 1,\n  "name": "Leanne Graham",\n  "isActive": true,\n  "tags": ["user", "admin"],\n  "address": {\n    "street": "Kulas Light",\n    "city": "Gwenborough"\n  }\n}');
    const [error, setError] = useState('');
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    const tsOutput = useMemo(() => {
        if (!jsonInput.trim()) {
            setError('');
            return '';
        }
        try {
            const parsed = JSON.parse(jsonInput);
            const ts = jsonToTypescript(parsed);
            setError('');
            return ts;
        } catch (e) {
            setError(e instanceof Error ? `Invalid JSON: ${e.message}` : 'Failed to parse JSON.');
            return '';
        }
    }, [jsonInput]);

    return (
        <ToolContainer>
            <ToolHeader
                title="JSON to Type Converter"
                description="Convert a JSON object into a TypeScript interface."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                    placeholder="Paste your JSON here..."
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                />
                <Card className="relative">
                    <pre className="text-sm bg-slate-900 rounded-md p-4 whitespace-pre-wrap break-all text-slate-300 h-full overflow-auto font-mono">
                        <code>{tsOutput || (error ? '' : '// TypeScript output will appear here')}</code>
                        {error && <code className="text-red-400">{error}</code>}
                    </pre>
                    {tsOutput && (
                        <Button
                            onClick={() => copyToClipboard(tsOutput)}
                            className="absolute top-2 right-2 px-3 py-1 text-xs"
                            variant="secondary"
                        >
                            {isCopied ? 'Copied!' : 'Copy'}
                        </Button>
                    )}
                </Card>
            </div>
        </ToolContainer>
    );
};
