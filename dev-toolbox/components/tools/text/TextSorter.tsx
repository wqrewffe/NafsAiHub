import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Card } from '../../common/Card';
import { Select } from '../../common/Select';

type SortType = 'az' | 'za' | 'len-asc' | 'len-desc' | 'num-asc' | 'num-desc' | 'random' | 'reverse';

export const TextSorter: React.FC = () => {
    const [input, setInput] = useState('Apple\nBanana\n10\nOrange\n\n2\nGrape\napple');
    const [output, setOutput] = useState('');
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    // Options state
    const [sortType, setSortType] = useState<SortType>('az');
    const [isCaseInsensitive, setIsCaseInsensitive] = useState(false);
    const [removeDuplicates, setRemoveDuplicates] = useState(false);
    const [removeEmptyLines, setRemoveEmptyLines] = useState(false);
    const [trimLines, setTrimLines] = useState(false);


    const handleApplyChanges = () => {
        let lines = input.split('\n');

        // 1. Cleaning operations
        if (trimLines) {
            lines = lines.map(line => line.trim());
        }
        if (removeEmptyLines) {
            lines = lines.filter(line => line.length > 0);
        }
        if (removeDuplicates) {
            if (isCaseInsensitive) {
                 const seen = new Set();
                 lines = lines.filter(line => {
                     const lowerLine = line.toLowerCase();
                     if (seen.has(lowerLine)) {
                         return false;
                     }
                     seen.add(lowerLine);
                     return true;
                 });
            } else {
                lines = [...new Set(lines)];
            }
        }
        
        // 2. Sorting operation
        switch (sortType) {
            case 'az':
                lines.sort((a, b) => isCaseInsensitive ? a.toLowerCase().localeCompare(b.toLowerCase()) : a.localeCompare(b));
                break;
            case 'za':
                lines.sort((a, b) => isCaseInsensitive ? b.toLowerCase().localeCompare(a.toLowerCase()) : b.localeCompare(a));
                break;
            case 'len-asc':
                lines.sort((a, b) => a.length - b.length);
                break;
            case 'len-desc':
                lines.sort((a, b) => b.length - a.length);
                break;
            case 'num-asc':
                lines.sort((a, b) => parseFloat(a) - parseFloat(b));
                break;
            case 'num-desc':
                lines.sort((a, b) => parseFloat(b) - parseFloat(a));
                break;
            case 'random':
                lines.sort(() => Math.random() - 0.5);
                break;
            case 'reverse':
                lines.reverse();
                break;
        }

        setOutput(lines.join('\n'));
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="Advanced Text Sorter"
                description="Sort, clean, and manipulate lists of text with powerful options."
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Textarea
                                placeholder="Enter text here, one item per line..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                rows={15}
                            />
                            <div className="relative">
                                <Textarea
                                    placeholder="Result..."
                                    value={output}
                                    readOnly
                                    rows={15}
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
                </div>
                <div className="lg:col-span-1 space-y-4">
                     <Card>
                        <h3 className="text-lg font-semibold text-white mb-3">Sorting</h3>
                        <div className="space-y-3">
                             <Select value={sortType} onChange={e => setSortType(e.target.value as SortType)}>
                                <option value="az">Alphabetical (A-Z)</option>
                                <option value="za">Alphabetical (Z-A)</option>
                                <option value="num-asc">Numerical (Asc)</option>
                                <option value="num-desc">Numerical (Desc)</option>
                                <option value="len-asc">Length (Short to Long)</option>
                                <option value="len-desc">Length (Long to Short)</option>
                                <option value="reverse">Reverse Order</option>
                                <option value="random">Randomize</option>
                            </Select>
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" checked={isCaseInsensitive} onChange={e => setIsCaseInsensitive(e.target.checked)} className="h-4 w-4 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500"/>
                                <span>Case Insensitive</span>
                            </label>
                        </div>
                    </Card>
                     <Card>
                        <h3 className="text-lg font-semibold text-white mb-3">Cleaning</h3>
                        <div className="space-y-3">
                             <label className="flex items-center space-x-2">
                                <input type="checkbox" checked={removeDuplicates} onChange={e => setRemoveDuplicates(e.target.checked)} className="h-4 w-4 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500"/>
                                <span>Remove Duplicate Lines</span>
                            </label>
                             <label className="flex items-center space-x-2">
                                <input type="checkbox" checked={removeEmptyLines} onChange={e => setRemoveEmptyLines(e.target.checked)} className="h-4 w-4 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500"/>
                                <span>Remove Empty Lines</span>
                            </label>
                             <label className="flex items-center space-x-2">
                                <input type="checkbox" checked={trimLines} onChange={e => setTrimLines(e.target.checked)} className="h-4 w-4 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500"/>
                                <span>Trim Whitespace</span>
                            </label>
                        </div>
                    </Card>
                    <div className="flex flex-col gap-2">
                        <Button onClick={handleApplyChanges}>Apply Changes</Button>
                        <Button onClick={() => { setInput(''); setOutput(''); }} variant="secondary">Clear</Button>
                    </div>
                </div>
            </div>
        </ToolContainer>
    );
};
