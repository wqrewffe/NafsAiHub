import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';

export const FindAndReplace: React.FC = () => {
    const [input, setInput] = useState('The quick brown fox jumps over the lazy dog.');
    const [findText, setFindText] = useState('fox');
    const [replaceText, setReplaceText] = useState('cat');
    const [isCaseSensitive, setIsCaseSensitive] = useState(false);
    const [isGlobal, setIsGlobal] = useState(true);

    const { output, matches } = useMemo(() => {
        if (!input || !findText) {
            return { output: input, matches: 0 };
        }
        try {
            const flags = (isGlobal ? 'g' : '') + (isCaseSensitive ? '' : 'i');
            const regex = new RegExp(findText, flags);
            const matches = (input.match(regex) || []).length;
            const newOutput = input.replace(regex, replaceText);
            return { output: newOutput, matches };
        } catch (e) {
            // Invalid regex, likely from special characters in findText
            return { output: input, matches: 0 };
        }
    }, [input, findText, replaceText, isCaseSensitive, isGlobal]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Find and Replace"
                description="Perform find and replace operations on your text with advanced options."
            />
            <Card>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Input placeholder="Find..." value={findText} onChange={e => setFindText(e.target.value)} />
                    <Input placeholder="Replace with..." value={replaceText} onChange={e => setReplaceText(e.target.value)} />
                </div>
                <div className="flex items-center space-x-4 mt-4">
                     <label className="flex items-center space-x-2">
                        <input type="checkbox" checked={isCaseSensitive} onChange={e => setIsCaseSensitive(e.target.checked)} className="h-4 w-4 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500"/>
                        <span>Case Sensitive</span>
                    </label>
                     <label className="flex items-center space-x-2">
                        <input type="checkbox" checked={isGlobal} onChange={e => setIsGlobal(e.target.checked)} className="h-4 w-4 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500"/>
                        <span>Global (all matches)</span>
                    </label>
                </div>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                    placeholder="Input text..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={12}
                />
                <div className="relative">
                    <Textarea
                        placeholder="Result..."
                        value={output}
                        readOnly
                        rows={12}
                        className="bg-slate-800/50"
                    />
                    <div className="absolute top-2 right-2 text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                        {matches} match(es)
                    </div>
                </div>
            </div>
        </ToolContainer>
    );
};
