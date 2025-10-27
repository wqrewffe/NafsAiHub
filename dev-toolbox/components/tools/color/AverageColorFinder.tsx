import React, { useState, useRef, useEffect } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

const rgbToHex = (r: number, g: number, b: number) => "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();

export const AverageColorFinder: React.FC = () => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [averageColor, setAverageColor] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCopied, copy] = useCopyToClipboard();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsLoading(true);
            setAverageColor(null);
            const reader = new FileReader();
            reader.onload = (event) => setImageSrc(event.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (!imageSrc || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            
            const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
            if (!imageData) return setIsLoading(false);
            
            let r = 0, g = 0, b = 0;
            for (let i = 0; i < imageData.data.length; i += 4) {
                r += imageData.data[i];
                g += imageData.data[i + 1];
                b += imageData.data[i + 2];
            }
            const pixelCount = imageData.data.length / 4;
            r = Math.floor(r / pixelCount);
            g = Math.floor(g / pixelCount);
            b = Math.floor(b / pixelCount);
            
            setAverageColor(rgbToHex(r, g, b));
            setIsLoading(false);
        };
        img.src = imageSrc;
    }, [imageSrc]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Average Color Finder"
                description="Upload an image to find the average color of all its pixels."
            />
            <Card>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                />
            </Card>

            <canvas ref={canvasRef} className="hidden"></canvas>
            
            {isLoading && <Card className="flex justify-center"><Loader text="Analyzing..." /></Card>}

            {imageSrc && averageColor && !isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card><img src={imageSrc} alt="Uploaded preview" className="max-w-full mx-auto rounded-md" /></Card>
                    <Card className="flex flex-col items-center justify-center text-center">
                        <div className="w-32 h-32 rounded-full mb-4 border-4 border-slate-700" style={{ backgroundColor: averageColor }}></div>
                        <h3 className="text-lg font-semibold text-white">Average Color</h3>
                        <button onClick={() => copy(averageColor)} className="font-mono text-2xl mt-1 text-slate-300 hover:text-white">
                             {isCopied ? 'Copied!' : averageColor}
                        </button>
                    </Card>
                </div>
            )}
        </ToolContainer>
    );
};
