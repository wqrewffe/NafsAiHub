import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { parseExif } from '../../../services/exifService';

const MetadataRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 border-t border-slate-800 py-3 first:border-t-0">
        <dt className="text-sm font-medium text-slate-400 truncate">{label}</dt>
        <dd className="col-span-2 text-sm text-white break-all">{String(value)}</dd>
    </div>
);

export const ExifViewer: React.FC = () => {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [metadata, setMetadata] = useState<Record<string, any> | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError('');
        setMetadata(null);
        setImagePreview(URL.createObjectURL(file));

        try {
            const buffer = await file.arrayBuffer();
            const exifData = parseExif(buffer);
            setMetadata(exifData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not parse EXIF data.');
            setMetadata({ Error: 'No valid EXIF data found.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ToolContainer>
            <ToolHeader title="EXIF Data Viewer" description="Extract and view hidden metadata (EXIF) from JPEG images." />
            <Card>
                <input type="file" accept="image/jpeg" onChange={handleFileChange} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"/>
            </Card>
            {isLoading && <Card><Loader text="Reading metadata..." /></Card>}
            {error && <p className="text-red-400 text-center">{error}</p>}
            {metadata && imagePreview && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card><img src={imagePreview} alt="Preview" className="max-w-full h-auto rounded-md object-contain" /></Card>
                    <Card>
                        <dl>
                           {Object.entries(metadata).map(([key, value]) => <MetadataRow key={key} label={key} value={value} />)}
                        </dl>
                    </Card>
                </div>
            )}
        </ToolContainer>
    );
};
