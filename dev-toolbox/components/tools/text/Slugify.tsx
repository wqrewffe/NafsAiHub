
import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Card } from '../../common/Card';
import { Select } from '../../common/Select';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Button } from '../../common/Button';

const slugify = (text: string, separator: string, toLowercase: boolean): string => {
  let str = text;
  if (toLowercase) {
    str = str.toLowerCase();
  }
  str = str.toString()
    .normalize('NFD') // split an accented letter in the base letter and the accent
    .replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
    .replace(/\s+/g, separator) // replace spaces with separator
    .replace(/[^\w-]+/g, '') // remove all non-word chars
    .replace(new RegExp(`\\${separator}+`, 'g'), separator) // replace multiple separators with single
    .replace(new RegExp(`^\\${separator}|\\${separator}$`, 'g'), ''); // trim separator from start/end
  return str;
};

export const Slugify: React.FC = () => {
    const [input, setInput] = useState('This is a Test Title!');
    const [separator, setSeparator] = useState('-');
    const [toLowercase, setToLowercase] = useState(true);
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    const output = useMemo(() => {
        return slugify(input, separator, toLowercase);
    }, [input, separator, toLowercase]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Slugify"
                description="Convert text into a clean, URL-friendly slug."
            />
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Textarea
                        placeholder="Enter text here..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        rows={8}
                    />
                    <div className="relative">
                        <Textarea
                            placeholder="Slug will appear here..."
                            value={output}
                            readOnly
                            rows={8}
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
            <Card>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1 w-full">
                        <label className="text-sm font-medium text-slate-300">Separator</label>
                        <Select value={separator} onChange={e => setSeparator(e.target.value)}>
                            <option value="-">Hyphen (-)</option>
                            <option value="_">Underscore (_)</option>
                        </Select>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="flex items-center space-x-2 pt-6">
                            <input
                                type="checkbox"
                                checked={toLowercase}
                                onChange={e => setToLowercase(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Convert to lowercase</span>
                        </label>
                    </div>
                </div>
            </Card>
        </ToolContainer>
    );
};
