import React, { useState, useRef, useEffect } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';

export const GrayscaleConverter: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [grayscaleImage, setGrayscaleImage] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setOriginalImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (originalImage && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                if (!ctx) return;
                
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = avg;     // red
                    data[i + 1] = avg; // green
                    data[i + 2] = avg; // blue
                }
                ctx.putImageData(imageData, 0, 0);
                setGrayscaleImage(canvas.toDataURL('image/png'));
            };
            img.src = originalImage;
        }
    }, [originalImage]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Photo to Grayscale Converter"
                description="Upload a color photo to convert it to grayscale. All processing is done in your browser."
            />
            <Card>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                />
            </Card>

            {originalImage && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Original Image</h3>
                        <img src={originalImage} alt="Original" className="max-w-full h-auto rounded-md" />
                    </Card>
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Grayscale Image</h3>
                        {grayscaleImage ? (
                            <>
                                <img src={grayscaleImage} alt="Grayscale" className="max-w-full h-auto rounded-md" />
                                <a href={grayscaleImage} download="grayscale-image.png">
                                    <Button className="w-full mt-4">Download Grayscale</Button>
                                </a>
                            </>
                        ) : (
                            <p className="text-slate-500">Converting...</p>
                        )}
                        <canvas ref={canvasRef} className="hidden"></canvas>
                    </Card>
                </div>
            )}
        </ToolContainer>
    );
};
