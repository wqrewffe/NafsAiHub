import React, { useState, useRef, useEffect } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';

export const ImageBorderAdder: React.FC = () => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [borderedImage, setBorderedImage] = useState<string | null>(null);
    const [borderWidth, setBorderWidth] = useState(20);
    const [borderColor, setBorderColor] = useState('#FFFFFF');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setImageSrc(event.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (imageSrc && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const newWidth = img.width + borderWidth * 2;
                const newHeight = img.height + borderWidth * 2;
                canvas.width = newWidth;
                canvas.height = newHeight;
                if (!ctx) return;
                
                ctx.fillStyle = borderColor;
                ctx.fillRect(0, 0, newWidth, newHeight);
                ctx.drawImage(img, borderWidth, borderWidth);

                setBorderedImage(canvas.toDataURL('image/png'));
            };
            img.src = imageSrc;
        }
    }, [imageSrc, borderWidth, borderColor]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Image Border Adder"
                description="Add a simple, solid-colored border around your image."
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Upload Image</h3>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                        />
                    </Card>
                    {imageSrc && (
                    <Card className="space-y-4">
                         <h3 className="text-lg font-semibold text-white">Border Options</h3>
                         <div>
                            <label>Width: {borderWidth}px</label>
                            <input type="range" min="1" max="100" value={borderWidth} onChange={e => setBorderWidth(parseInt(e.target.value))} className="w-full"/>
                         </div>
                         <div>
                            <label>Color</label>
                            <Input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)} className="w-full h-10 p-1"/>
                         </div>
                    </Card>
                    )}
                </div>
                <Card className="lg:col-span-2 flex flex-col items-center justify-center p-4">
                    {borderedImage ? (
                        <>
                            <img src={borderedImage} alt="Bordered preview" className="max-w-full max-h-[50vh] rounded-md" />
                            <a href={borderedImage} download="bordered-image.png">
                                <Button className="w-full mt-4">Download Image</Button>
                            </a>
                        </>
                    ) : (
                        <p className="text-slate-500">Upload an image to start</p>
                    )}
                    <canvas ref={canvasRef} className="hidden"></canvas>
                </Card>
            </div>
        </ToolContainer>
    );
};
