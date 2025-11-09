import React, { useState, useRef, useEffect } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';

export const ImageColorInverter: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [invertedImage, setInvertedImage] = useState<string | null>(null);
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
                    data[i] = 255 - data[i];     // red
                    data[i + 1] = 255 - data[i + 1]; // green
                    data[i + 2] = 255 - data[i + 2]; // blue
                }
                ctx.putImageData(imageData, 0, 0);
                setInvertedImage(canvas.toDataURL('image/png'));
            };
            img.src = originalImage;
        }
    }, [originalImage]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Image Color Inverter"
                description="Invert the colors of any image. Red becomes cyan, green becomes magenta, and blue becomes yellow."
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
                        <h3 className="text-lg font-semibold text-white mb-2">Inverted Image</h3>
                        {invertedImage ? (
                            <>
                                <img src={invertedImage} alt="Inverted" className="max-w-full h-auto rounded-md" />
                                <a href={invertedImage} download="inverted-image.png">
                                    <Button className="w-full mt-4">Download Inverted</Button>
                                </a>
                            </>
                        ) : (
                            <p className="text-slate-500">Inverting...</p>
                        )}
                        <canvas ref={canvasRef} className="hidden"></canvas>
                    </Card>
                </div>
            )}
        </ToolContainer>
    );
};
