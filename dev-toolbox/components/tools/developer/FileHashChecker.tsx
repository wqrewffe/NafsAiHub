import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Loader } from '../../common/Loader';

const HASH_ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-512'];

async function calculateHash(algorithm: string, buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const HashResultRow: React.FC<{ name: string; value: string }> = ({ name, value }) => {
    const [isCopied, copy] = useCopyToClipboard();
    return (
        <div className="bg-slate-800/50 p-3 rounded-lg">
            <h4 className="text-sm font-semibold text-indigo-400">{name}</h4>
            <div className="flex items-center gap-2 mt-1">
                <p className="font-mono text-sm text-slate-300 break-all flex-grow">{value}</p>
                <Button variant="ghost" onClick={() => copy(value)} className="px-2 py-1 text-xs flex-shrink-0">
                    {isCopied ? 'Copied' : 'Copy'}
                </Button>
            </div>
        </div>
    );
};

export const FileHashChecker: React.FC = () => {
    const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
    const [hashes, setHashes] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileInfo({ name: file.name, size: file.size });
        setHashes({});
        setError('');
        setIsLoading(true);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const buffer = event.target?.result as ArrayBuffer;
                const newHashes: Record<string, string> = {};
                for (const alg of HASH_ALGORITHMS) {
                    newHashes[alg] = await calculateHash(alg, buffer);
                }
                setHashes(newHashes);
            } catch (err) {
                setError('Failed to calculate hashes.');
            } finally {
                setIsLoading(false);
            }
        };
        reader.onerror = () => {
            setError('Failed to read the file.');
            setIsLoading(false);
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="File Hash Checker"
                description="Calculate SHA hashes for a local file to verify its integrity. All processing is done in your browser."
            />
            <Card>
                <input
                    type="file"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                />
            </Card>

            {isLoading && (
                <Card className="flex items-center justify-center min-h-[150px]">
                    <Loader text="Calculating hashes..." />
                </Card>
            )}
            
            {error && <p className="text-red-400 text-center">{error}</p>}

            {!isLoading && Object.keys(hashes).length > 0 && fileInfo && (
                <Card>
                    <h3 className="text-lg font-semibold text-white mb-3">Results for <span className="text-indigo-400">{fileInfo.name}</span></h3>
                    <p className="text-sm text-slate-400 mb-4">Size: {(fileInfo.size / 1024 / 1024).toFixed(2)} MB</p>
                    <div className="space-y-3">
                        {HASH_ALGORITHMS.map(alg => (
                            <HashResultRow key={alg} name={alg} value={hashes[alg]} />
                        ))}
                    </div>
                </Card>
            )}
        </ToolContainer>
    );
};