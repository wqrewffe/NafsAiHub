import React, { useState } from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { tools } from './index';

const PasswordGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'password-generator')!;
    const [history, setHistory] = useState<string[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const optionsConfig: ToolOptionConfig[] = [
        { name: 'length', label: 'Length', type: 'number', defaultValue: 16 },
        { name: 'use_upper', label: 'Include Uppercase', type: 'text', defaultValue: 'true' },
        { name: 'use_digits', label: 'Include Digits', type: 'text', defaultValue: 'true' },
        { name: 'use_symbols', label: 'Include Symbols', type: 'text', defaultValue: 'true' },
    ];

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
            const res = await fetch('https://nafsbackend.onrender.com/api/utility/password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options),
        });
        const data = await res.json();
        const password = typeof data === 'string' ? data : data?.password;
        if (password) setHistory(prev => [password, ...prev]); // add to history
        setCopiedIndex(null);
        return data;
    };

    const renderOutput = () => {
        if (!history.length) return null;

        return (
            <div className="mt-2 flex flex-col gap-3">
                {history.map((password, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md font-mono text-lg break-all flex-1">
                            {password}
                        </div>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(password);
                                setCopiedIndex(idx);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md transition"
                        >
                            {copiedIndex === idx ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            optionsConfig={optionsConfig}
            onGenerate={handleGenerate}
            renderOutput={renderOutput}
        />
    );
};

export default PasswordGenerator;
