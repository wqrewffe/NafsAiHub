import React, { useState, useRef, useCallback } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Select } from '../../common/Select';
import { Loader } from '../../common/Loader';

// Helper function to format bytes
const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Main component
export const ImageCompressor: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<{ src: string; file: File } | null>(null);
    const [compressedImage, setCompressedImage] = useState<{ src: string; size: number } | null>(null);
    const [targetSize, setTargetSize] = useState(4);
    const [targetUnit, setTargetUnit] = useState<'MB' | 'KB'>('MB');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setOriginalImage({ src: URL.createObjectURL(file), file });
            setCompressedImage(null);
            setError('');
        }
    };

    const compressImage = useCallback(async () => {
        if (!originalImage || !canvasRef.current) return;

        setIsLoading(true);
        setCompressedImage(null);
        setError('');

        const targetBytes = targetUnit === 'MB' ? targetSize * 1024 * 1024 : targetSize * 1024;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setError('Could not get canvas context.');
            setIsLoading(false);
            return;
        }

        const img = new Image();
        img.src = originalImage.src;
        await new Promise(resolve => { img.onload = resolve; });

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Binary search for the right quality
        let minQuality = 0;
        let maxQuality = 1;
        let bestBlob: Blob | null = null;

        for (let i = 0; i < 10; i++) { // 10 iterations for precision
            const quality = (minQuality + maxQuality) / 2;
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
            
            if (!blob) {
                 maxQuality = quality; // something went wrong, lower quality
                 continue;
            }

            if (blob.size > targetBytes) {
                maxQuality = quality;
            } else {
                minQuality = quality;
                bestBlob = blob;
            }
        }
        
        if (bestBlob) {
            setCompressedImage({
                src: URL.createObjectURL(bestBlob),
                size: bestBlob.size,
            });
        } else {
            // If no suitable quality was found (e.g., image is already smaller), try with a low default
            const fallbackBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.1));
            if (fallbackBlob) {
                 setCompressedImage({
                    src: URL.createObjectURL(fallbackBlob),
                    size: fallbackBlob.size,
                });
            } else {
                setError('Could not compress the image. It might be too small or in an unsupported format.');
            }
        }
        
        setIsLoading(false);

    }, [originalImage, targetSize, targetUnit]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Image Compressor"
                description="Resize your images to a target file size (e.g., 4MB) for web optimization."
            />
            <canvas ref={canvasRef} className="hidden"></canvas>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                 {/* Input Column */}
                 <div className="space-y-4">
                     <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">1. Upload Image</h3>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"/>
                     </Card>
                     {originalImage && (
                        <Card>
                            <h3 className="text-lg font-semibold text-white mb-2">2. Set Target Size</h3>
                             <div className="flex gap-2">
                                <Input type="number" value={targetSize} onChange={e => setTargetSize(Number(e.target.value))} />
                                <Select value={targetUnit} onChange={e => setTargetUnit(e.target.value as 'MB' | 'KB')}>
                                    <option>MB</option>
                                    <option>KB</option>
                                </Select>
                            </div>
                            <Button onClick={compressImage} disabled={isLoading} className="w-full mt-4">
                                {isLoading ? 'Compressing...' : 'Compress Image'}
                            </Button>
                        </Card>
                     )}
                     {originalImage && (
                        <Card>
                             <h3 className="text-lg font-semibold text-white mb-2">Original Image</h3>
                             <img src={originalImage.src} alt="Original" className="max-w-full rounded" />
                             <p className="text-center mt-2 text-slate-400">
                                Size: {formatBytes(originalImage.file.size)}
                             </p>
                        </Card>
                     )}
                 </div>

                 {/* Output Column */}
                <div>
                    {isLoading && (
                        <Card className="flex items-center justify-center h-full min-h-[300px]">
                            <Loader text="Finding optimal quality..." />
                        </Card>
                    )}
                    {error && <Card><p className="text-red-400 text-center">{error}</p></Card>}
                    {compressedImage ? (
                        <Card>
                            <h3 className="text-lg font-semibold text-white mb-2">Compressed Image</h3>
                             <img src={compressedImage.src} alt="Compressed" className="max-w-full rounded" />
                             <div className="text-center mt-2 space-y-2">
                                <p className="text-xl font-bold text-white">
                                    New Size: {formatBytes(compressedImage.size)}
                                </p>
                                {originalImage && (
                                    <p className="text-green-400 text-sm">
                                        {(100 - (compressedImage.size / originalImage.file.size) * 100).toFixed(1)}% size reduction
                                    </p>
                                )}
                                <a href={compressedImage.src} download={`compressed-${originalImage?.file.name ?? 'image.jpg'}`}>
                                    <Button className="w-full mt-2">Download Compressed Image</Button>
                                </a>
                             </div>
                        </Card>
                    ) : !isLoading && (
                        <Card className="flex items-center justify-center h-full min-h-[300px]">
                            <p className="text-slate-500">Compressed image will appear here</p>
                        </Card>
                    )}
                </div>
            </div>
        </ToolContainer>
    );
};
