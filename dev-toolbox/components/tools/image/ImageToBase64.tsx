import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Button } from '../../common/Button';
import { Textarea } from '../../common/Textarea';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Card } from '../../common/Card';

export const ImageToBase64: React.FC = () => {
    const [base64, setBase64] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isCopied, copyToClipboard] = useCopyToClipboard();
    const [fileName, setFileName] = useState('image.png');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setError('');
            setFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setBase64(result);
                setImagePreview(result);
            };
            reader.onerror = () => {
                setError('Failed to read the file.');
                setBase64('');
                setImagePreview(null);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="Image to Base64 Converter"
                description="Convert your image files into Base64 data strings."
            />
            <Card>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                />
            </Card>

            {error && <p className="text-red-400 text-center">{error}</p>}

            {imagePreview && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Image Preview</h3>
                        <img src={imagePreview} alt="Preview" className="max-w-full h-auto rounded-md border border-slate-700" />
                        <div className="mt-4">
                            <a
                                href={imagePreview}
                                download={fileName}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded transition-colors duration-200 w-full inline-block text-center"
                            >
                                Download Image
                            </a>
                        </div>
                    </div>
                    <div className="relative">
                        <h3 className="text-lg font-semibold text-white mb-2">Base64 String</h3>
                        <Textarea
                            value={base64}
                            readOnly
                            rows={10}
                            className="bg-slate-800 font-mono text-sm"
                        />
                        <Button
                            onClick={() => copyToClipboard(base64)}
                            className="absolute top-10 right-2 px-3 py-1 text-sm"
                            variant="secondary"
                        >
                            {isCopied ? 'Copied!' : 'Copy'}
                        </Button>
                    </div>
                 </div>
            )}
        </ToolContainer>
    );
};