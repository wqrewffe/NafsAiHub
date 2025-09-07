import React, { useState, useRef, useEffect } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Select } from '../../common/Select';
import { Loader } from '../../common/Loader';

type BlindnessType = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

// Color transformation matrices for simulating color blindness
const MATRICES: Record<BlindnessType, number[]> = {
    none: [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
    ],
    protanopia: [ // Red-blind
        0.567, 0.433, 0,
        0.558, 0.442, 0,
        0, 0.242, 0.758,
    ],
    deuteranopia: [ // Green-blind
        0.625, 0.375, 0,
        0.7, 0.3, 0,
        0, 0.3, 0.7,
    ],
    tritanopia: [ // Blue-blind
        0.95, 0.05, 0,
        0, 0.433, 0.567,
        0, 0.475, 0.525,
    ],
    achromatopsia: [ // Total color blindness
        0.299, 0.587, 0.114,
        0.299, 0.587, 0.114,
        0.299, 0.587, 0.114,
    ],
};

export const ColorBlindnessSimulator: React.FC = () => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [simulatedImage, setSimulatedImage] = useState<string | null>(null);
    const [type, setType] = useState<BlindnessType>('protanopia');
    const [isLoading, setIsLoading] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageSrc(URL.createObjectURL(file));
        }
    };

    useEffect(() => {
        if (!imageSrc || !canvasRef.current) return;
        setIsLoading(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            if (!ctx) return setIsLoading(false);
            
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const matrix = MATRICES[type];

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                data[i] = r * matrix[0] + g * matrix[1] + b * matrix[2];
                data[i + 1] = r * matrix[3] + g * matrix[4] + b * matrix[5];
                data[i + 2] = r * matrix[6] + g * matrix[7] + b * matrix[8];
            }
            ctx.putImageData(imageData, 0, 0);
            setSimulatedImage(canvas.toDataURL('image/png'));
            setIsLoading(false);
        };
        img.src = imageSrc;
    }, [imageSrc, type]);

    return (
        <ToolContainer>
            <ToolHeader title="Color Blindness Simulator" description="Upload an image to see how it might look to people with different types of color vision deficiency." />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                     <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">1. Upload Image</h3>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"/>
                     </Card>
                     {imageSrc && (
                         <Card>
                            <h3 className="text-lg font-semibold text-white mb-2">2. Select Simulation</h3>
                            <Select value={type} onChange={e => setType(e.target.value as BlindnessType)}>
                                <option value="protanopia">Protanopia (Red-blind)</option>
                                <option value="deuteranopia">Deuteranopia (Green-blind)</option>
                                <option value="tritanopia">Tritanopia (Blue-blind)</option>
                                <option value="achromatopsia">Achromatopsia (Monochrome)</option>
                            </Select>
                         </Card>
                     )}
                </div>
                <Card className="lg:col-span-2">
                     <h3 className="text-lg font-semibold text-white mb-2">Simulation Preview</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-center">
                            <h4 className="text-sm text-slate-400 mb-2">Original</h4>
                            {imageSrc ? <img src={imageSrc} className="max-w-full rounded" /> : <div className="aspect-video bg-slate-800 rounded flex items-center justify-center"><p className="text-slate-500">Upload an image</p></div>}
                        </div>
                        <div className="text-center">
                             <h4 className="text-sm text-slate-400 mb-2">Simulated</h4>
                             {isLoading && <div className="aspect-video bg-slate-800 rounded flex items-center justify-center"><Loader/></div>}
                             {!isLoading && simulatedImage && <img src={simulatedImage} className="max-w-full rounded" />}
                             {!isLoading && !imageSrc && <div className="aspect-video bg-slate-800 rounded"></div>}
                        </div>
                     </div>
                </Card>
            </div>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </ToolContainer>
    );
};