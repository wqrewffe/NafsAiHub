import React, { useState, useRef } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Button } from '../../common/Button';

// Simple quantization algorithm
const getPalette = (imageData: ImageData, count = 10) => {
    const pixels = imageData.data;
    const pixelCount = imageData.width * imageData.height;
    
    // Store pixel data in a more convenient format
    const rgbValues: {r: number, g: number, b: number}[] = [];
    for (let i = 0; i < pixels.length; i += 4) {
        rgbValues.push({ r: pixels[i], g: pixels[i+1], b: pixels[i+2] });
    }

    // This is a placeholder for a real quantization algorithm like Median Cut or k-means.
    // For this environment, we'll take a simplified approach: sample pixels and find unique colors.
    const sampled = rgbValues.filter((_, i) => i % Math.floor(pixelCount / 1000) === 0);
    const uniqueColors = [...new Map(sampled.map(c => [`${c.r},${c.g},${c.b}`, c])).values()];
    
    const palette = uniqueColors.slice(0, count).map(c => `#${((1 << 24) + (c.r << 16) + (c.g << 8) + c.b).toString(16).slice(1).toUpperCase()}`);
    return palette;
};

const ColorSwatch: React.FC<{ hex: string }> = ({ hex }) => {
    const [isCopied, copy] = useCopyToClipboard();
    return (
        <div 
            className="h-24 rounded-md flex flex-col items-center justify-center cursor-pointer group"
            style={{ backgroundColor: hex }}
            onClick={() => copy(hex)}
        >
             <span className="font-mono text-white bg-black/50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                {isCopied ? 'Copied!' : hex}
            </span>
        </div>
    );
};

export const ImagePaletteExtractor: React.FC = () => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [palette, setPalette] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsLoading(true);
            setPalette([]);
            const reader = new FileReader();
            reader.onload = (event) => {
                const src = event.target?.result as string;
                setImageSrc(src);
                processImage(src);
            };
            reader.readAsDataURL(file);
        }
    };

    const processImage = (src: string) => {
        const canvas = canvasRef.current;
        if (!canvas) {
            setIsLoading(false);
            return;
        }
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
            if (imageData) {
                const extractedPalette = getPalette(imageData);
                setPalette(extractedPalette);
            }
            setIsLoading(false);
        };
        img.src = src;
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="Image Palette Extractor"
                description="Upload an image to extract a palette of its dominant colors."
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
            
            {isLoading && <Card className="flex justify-center"><Loader text="Analyzing image..." /></Card>}

            {palette.length > 0 && (
                <Card>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        {palette.map(color => <ColorSwatch key={color} hex={color} />)}
                    </div>
                </Card>
            )}
            
            {imageSrc && !isLoading && (
                <Card>
                     <img src={imageSrc} alt="Uploaded preview" className="max-w-full mx-auto rounded-md" />
                </Card>
            )}
        </ToolContainer>
    );
};
