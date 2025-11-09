
import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Input } from '../../common/Input';
import { Card } from '../../common/Card';

export const RegexTester: React.FC = () => {
    const [regex, setRegex] = useState('\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b');
    const [flags, setFlags] = useState('gi');
    const [testString, setTestString] = useState('Here are some emails: test@example.com, another.email@domain.co.uk, and invalid-email@.com.');
    const [error, setError] = useState('');

    const highlightedText = useMemo(() => {
        try {
            const re = new RegExp(regex, flags);
            setError('');
            return testString.replace(re, (match) => `<mark>${match}</mark>`);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Invalid Regex');
            return testString;
        }
    }, [regex, flags, testString]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Regex Tester"
                description="Test your regular expressions with live match highlighting."
            />
            <Card>
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex flex-1">
                        <span className="flex items-center p-2 bg-slate-700 rounded-l-md text-slate-400">/</span>
                        <Input
                            value={regex}
                            onChange={e => setRegex(e.target.value)}
                            placeholder="Regular Expression"
                            className="font-mono rounded-none"
                        />
                        <span className="flex items-center p-2 bg-slate-700 rounded-r-md text-slate-400">/</span>
                    </div>
                    <Input
                        value={flags}
                        onChange={e => setFlags(e.target.value)}
                        placeholder="flags"
                        className="font-mono sm:w-20"
                    />
                </div>
                 {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </Card>
            
            <Textarea
                placeholder="Test String"
                value={testString}
                onChange={e => setTestString(e.target.value)}
                rows={8}
                className="font-mono"
            />
            
            <Card>
                <h3 className="text-lg font-semibold text-white mb-2">Result</h3>
                <div 
                    className="p-4 bg-slate-900 rounded-md font-mono whitespace-pre-wrap break-words"
                    dangerouslySetInnerHTML={{ __html: highlightedText.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/<mark>/g, '<mark class="bg-indigo-500/50 text-white rounded px-1">').replace(/<\/mark>/g, '</mark>') }} 
                />
            </Card>

        </ToolContainer>
    );
};
