
import React, { useState, useRef, useEffect } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Loader } from '../../common/Loader';

export const ImageResizer: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [resizedImage, setResizedImage] = useState<string | null>(null);
    const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
    const [newWidth, setNewWidth] = useState(0);
    const [newHeight, setNewHeight] = useState(0);
    const [aspectRatioLocked, setAspectRatioLocked] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const src = event.target?.result as string;
                setOriginalImage(src);
                const img = new Image();
                img.onload = () => {
                    setOriginalDimensions({ width: img.width, height: img.height });
                    setNewWidth(Math.round(img.width / 2));
                    setNewHeight(Math.round(img.height / 2));
                };
                img.src = src;
            };
            reader.readAsDataURL(file);
        }
    };
    
    useEffect(() => {
        if (!originalImage || newWidth <= 0 || newHeight <= 0) return;

        setIsLoading(true);
        setResizedImage(null);
        
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) {
            setIsLoading(false);
            return;
        }

        const img = new Image();
        img.onload = () => {
            canvas!.width = newWidth;
            canvas!.height = newHeight;
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            setResizedImage(canvas!.toDataURL('image/png'));
            setIsLoading(false);
        };
        img.src = originalImage;
        
    }, [originalImage, newWidth, newHeight]);


    const handleWidthChange = (w: number) => {
        setNewWidth(w);
        if (aspectRatioLocked && originalDimensions.width > 0) {
            const ratio = originalDimensions.height / originalDimensions.width;
            setNewHeight(Math.round(w * ratio));
        }
    };
    
    const handleHeightChange = (h: number) => {
        setNewHeight(h);
        if (aspectRatioLocked && originalDimensions.height > 0) {
            const ratio = originalDimensions.width / originalDimensions.height;
            setNewWidth(Math.round(h * ratio));
        }
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="Image Resizer"
                description="Resize your images to specific dimensions while maintaining aspect ratio."
            />
            <canvas ref={canvasRef} className="hidden"></canvas>
            <Card>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                />
            </Card>

            {originalImage && (
                <>
                <Card>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <Input type="number" value={newWidth} onChange={e => handleWidthChange(parseInt(e.target.value))} />
                        <Button variant="ghost" onClick={() => setAspectRatioLocked(!aspectRatioLocked)} className="p-2">
                            {aspectRatioLocked ? 
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a7 7 0 00-7 7c0 3.584 2.686 6.5 6 6.92V18a1 1 0 102 0v-1.08c3.314-.42 6-3.336 6-6.92a7 7 0 00-7-7zM8 9a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 4a1 1 0 100 2h2a1 1 0 100-2H9z" clipRule="evenodd" /></svg>
                                : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C3.732 4.943 7.523 3 10 3s6.268 1.943 9.542 7c-3.274 5.057-7.03 7-9.542 7S3.732 15.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>}
                        </Button>
                        <Input type="number" value={newHeight} onChange={e => handleHeightChange(parseInt(e.target.value))} />
                    </div>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Original</h3>
                        <p className="text-sm text-slate-400 mb-2">{originalDimensions.width} x {originalDimensions.height}px</p>
                        <img src={originalImage} className="max-w-full rounded"/>
                    </Card>
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Resized</h3>
                        <p className="text-sm text-slate-400 mb-2">{newWidth} x {newHeight}px</p>
                        {isLoading && <Loader text="Resizing..."/>}
                        {resizedImage && !isLoading && (
                            <>
                                <img src={resizedImage} className="max-w-full rounded"/>
                                <a href={resizedImage} download="resized-image.png"><Button className="w-full mt-4">Download</Button></a>
                            </>
                        )}
                    </Card>
                </div>
                </>
            )}
        </ToolContainer>
    );
};
