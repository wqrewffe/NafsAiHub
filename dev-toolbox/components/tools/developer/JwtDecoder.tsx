import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Card } from '../../common/Card';

const JsonViewer: React.FC<{ data: object | null, title: string }> = ({ data, title }) => (
    <Card>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <pre className="text-sm bg-slate-900 rounded-md p-4 whitespace-pre-wrap break-all text-slate-300">
            {data ? JSON.stringify(data, null, 2) : 'No data'}
        </pre>
    </Card>
);

export const JwtDecoder: React.FC = () => {
    const [jwt, setJwt] = useState('');
    const [error, setError] = useState('');

    const decoded = useMemo(() => {
        if (!jwt.trim()) {
            setError('');
            return { header: null, payload: null };
        }
        
        try {
            const parts = jwt.split('.');
            if (parts.length !== 3) {
                throw new Error("Invalid JWT structure. It must have three parts separated by dots.");
            }
            const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            setError('');
            return { header, payload };
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to decode JWT.");
            return { header: null, payload: null };
        }
    }, [jwt]);

    return (
        <ToolContainer>
            <ToolHeader
                title="JWT Decoder"
                description="Decode a JSON Web Token to view its header and payload."
            />
            <Textarea
                placeholder="Paste your JWT here..."
                value={jwt}
                onChange={e => setJwt(e.target.value)}
                rows={8}
                className="font-mono"
            />
            {error && <p className="text-red-400 text-center">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <JsonViewer data={decoded.header} title="Header" />
                <JsonViewer data={decoded.payload} title="Payload" />
            </div>
        </ToolContainer>
    );
};
