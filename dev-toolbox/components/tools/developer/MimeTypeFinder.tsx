import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Button } from '../../common/Button';
import { MIME_TYPES } from '../../../services/mimeTypeService';

export const MimeTypeFinder: React.FC = () => {
    const [search, setSearch] = useState('pdf');
    const [isCopied, copy] = useCopyToClipboard();

    const results = useMemo(() => {
        if (!search.trim()) return [];
        const lowerSearch = search.toLowerCase().replace(/^\./, '');
        return Object.entries(MIME_TYPES).filter(([ext]) => ext.includes(lowerSearch));
    }, [search]);

    return (
        <ToolContainer>
            <ToolHeader
                title="MIME Type Finder"
                description="Look up the official IANA MIME type for any file extension."
            />
            <Card>
                <Input
                    placeholder="Search by extension (e.g., jpg, pdf, mp4)..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </Card>
            <Card>
                 <div className="max-h-96 overflow-y-auto">
                    {results.length > 0 ? (
                        results.map(([ext, mime]) => (
                            <div key={ext} className="flex items-center justify-between p-3 border-b border-slate-800 last:border-b-0">
                                <span className="font-mono text-indigo-400">.{ext}</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-300">{mime}</span>
                                    <Button onClick={() => copy(mime)} variant="ghost" className="px-2 py-1 text-xs">
                                        {isCopied ? 'Copied' : 'Copy'}
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 text-center p-4">No results found.</p>
                    )}
                 </div>
            </Card>
        </ToolContainer>
    );
};
