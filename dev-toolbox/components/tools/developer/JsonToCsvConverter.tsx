import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

const jsonToCsv = (jsonString: string): { csv: string; error: string | null } => {
    try {
        let data = JSON.parse(jsonString);
        if (!Array.isArray(data)) {
            data = [data]; // Handle single object case
        }
        if (data.length === 0) {
            return { csv: '', error: null };
        }

        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];

        for (const row of data) {
            const values = headers.map(header => {
                const val = row[header];
                if (val === null || val === undefined) return '""';
                const escaped = ('' + val).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }

        return { csv: csvRows.join('\n'), error: null };
    } catch (e) {
        return { csv: '', error: e instanceof Error ? e.message : 'Invalid JSON input.' };
    }
};

export const JsonToCsvConverter: React.FC = () => {
    const [input, setInput] = useState('[{"id":1,"name":"Alice","email":"alice@example.com"},{"id":2,"name":"Bob","email":"bob@example.com"}]');
    const [isCopied, copy] = useCopyToClipboard();

    const { csv, error } = useMemo(() => jsonToCsv(input), [input]);

    const handleDownload = () => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <ToolContainer>
            <ToolHeader title="JSON to CSV Converter" description="Convert JSON arrays (or a single object) into CSV format." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea placeholder="Paste JSON here..." value={input} onChange={(e) => setInput(e.target.value)} rows={12} className="font-mono text-sm" />
                <div className="relative">
                    <Textarea placeholder="CSV output..." value={error || csv} readOnly rows={12} className={`font-mono text-sm ${error ? 'border-red-500 text-red-400' : 'bg-slate-800/50'}`} />
                    {csv && !error && <Button onClick={() => copy(csv)} className="absolute top-2 right-2 px-3 py-1 text-xs" variant="secondary">{isCopied ? 'Copied!' : 'Copy'}</Button>}
                </div>
            </div>
            {csv && !error && <Button onClick={handleDownload}>Download CSV</Button>}
        </ToolContainer>
    );
};