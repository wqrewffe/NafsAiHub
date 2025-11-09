import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Input } from '../../common/Input';

const UUIDRow: React.FC<{ uuid: string }> = ({ uuid }) => {
    const [isCopied, copyToClipboard] = useCopyToClipboard();
    return (
        <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-lg">
            <span className="font-mono text-slate-300 flex-grow truncate">{uuid}</span>
            <Button variant="ghost" onClick={() => copyToClipboard(uuid)} className="px-2 py-1 text-xs">
                {isCopied ? 'Copied!' : 'Copy'}
            </Button>
        </div>
    );
};

export const UUIDGenerator: React.FC = () => {
    const [uuids, setUuids] = useState<string[]>([]);
    const [count, setCount] = useState(1);

    const generateUuids = () => {
        const newUuids = Array.from({ length: count }, () => crypto.randomUUID());
        setUuids(newUuids);
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="UUID Generator"
                description="Generate Version 4 UUIDs (Universally Unique Identifiers)."
            />
            <Card>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center gap-2 flex-grow">
                        <label htmlFor="uuid-count" className="text-slate-300 whitespace-nowrap">How many?</label>
                        <Input
                            id="uuid-count"
                            type="number"
                            min="1"
                            max="100"
                            value={count}
                            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value, 10)))}
                            className="w-24"
                        />
                    </div>
                    <Button onClick={generateUuids} className="w-full sm:w-auto">
                        Generate
                    </Button>
                </div>
            </Card>

            {uuids.length > 0 && (
                <Card>
                    <h3 className="text-lg font-semibold text-white mb-3">Generated UUIDs</h3>
                    <div className="space-y-2">
                        {uuids.map((uuid, index) => <UUIDRow key={index} uuid={uuid} />)}
                    </div>
                </Card>
            )}
        </ToolContainer>
    );
};