
import React, { useState, useRef, useCallback } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Button } from '../../common/Button';

// --- Helper Functions ---
const rgbToHex = (r: number, g: number, b: number) => '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();

const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const ColorInfo: React.FC<{ label: string; value: string }> = ({ label, value }) => {
    const [isCopied, copyToClipboard] = useCopyToClipboard();
    return (
        <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded-md">
            <span className="text-sm text-slate-400">{label}</span>
            <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-white">{value}</span>
                <Button variant="ghost" className="p-1 h-auto" onClick={() => copyToClipboard(value)} aria-label={`Copy ${label}`}>
                    {isCopied ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    )}
                </Button>
            </div>
        </div>
    );
};

const PickedColor: React.FC<{ color: string }> = ({ color }) => {
    const [isCopied, copyToClipboard] = useCopyToClipboard();
    return (
        <button
            title={`Copy ${color}`}
            onClick={() => copyToClipboard(color)}
            className="w-full aspect-square rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            style={{ backgroundColor: color }}
        >
            {isCopied && <span className="text-white text-xs">Copied!</span>}
        </button>
    );
};


export const ColorPickerFromImage: React.FC = () => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [hoverColor, setHoverColor] = useState<{ hex: string; rgb: string; hsl: string } | null>(null);
    const [pickedColors, setPickedColors] = useState<string[]>([]);
    const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);
    const [fileName, setFileName] = useState('image.png');

    const mainCanvasRef = useRef<HTMLCanvasElement>(null);
    const loupeCanvasRef = useRef<HTMLCanvasElement>(null);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (event) => {
                const src = event.target?.result as string;
                setImageSrc(src);
                const img = new Image();
                img.onload = () => {
                    const canvas = mainCanvasRef.current;
                    if (canvas) {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx?.drawImage(img, 0, 0, img.width, img.height);
                    }
                };
                img.src = src;
                // Reset state
                setHoverColor(null);
                setPickedColors([]);
                setMousePos(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const drawLoupe = useCallback((x: number, y: number) => {
        const mainCanvas = mainCanvasRef.current;
        const loupeCanvas = loupeCanvasRef.current;
        if (!mainCanvas || !loupeCanvas) return;

        const loupeCtx = loupeCanvas.getContext('2d');
        if (!loupeCtx) return;

        const size = 120; // Loupe canvas size
        const zoom = 10;
        const sourceSize = size / zoom;

        loupeCtx.clearRect(0, 0, size, size);
        loupeCtx.imageSmoothingEnabled = false; // For pixelated effect
        
        loupeCtx.drawImage(
            mainCanvas,
            x - sourceSize / 2, y - sourceSize / 2, // source rect top-left
            sourceSize, sourceSize,                   // source rect dimensions
            0, 0,                                     // destination rect top-left
            size, size                                // destination rect dimensions
        );

        // Draw crosshair
        loupeCtx.strokeStyle = '#FFFFFF';
        loupeCtx.lineWidth = 2;
        loupeCtx.beginPath();
        loupeCtx.moveTo(size / 2, 0);
        loupeCtx.lineTo(size / 2, size);
        loupeCtx.moveTo(0, size / 2);
        loupeCtx.lineTo(size, size / 2);
        loupeCtx.stroke();
    }, []);
    
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = mainCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        
        // Calculate the mouse position relative to the canvas, accounting for display scaling
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = Math.floor((e.clientX - rect.left) * scaleX);
        const canvasY = Math.floor((e.clientY - rect.top) * scaleY);

        setMousePos({ x: e.clientX, y: e.clientY });

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data;
        const [r, g, b] = [pixel[0], pixel[1], pixel[2]];
        const hex = rgbToHex(r, g, b);
        const hsl = rgbToHsl(r, g, b);
        
        setHoverColor({
            hex,
            rgb: `rgb(${r}, ${g}, ${b})`,
            hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
        });

        drawLoupe(canvasX, canvasY);
    };

    const handleMouseLeave = () => {
        setHoverColor(null);
        setMousePos(null);
    };

    const handleCanvasClick = () => {
        if (hoverColor && !pickedColors.includes(hoverColor.hex)) {
            setPickedColors(prev => [...prev, hoverColor.hex]);
        }
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="Advanced Color Picker"
                description="Upload an image, then hover for a live magnified preview and click to build a color palette."
            />
            <Card>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                />
            </Card>
            
            {!imageSrc && (
                <Card className="flex items-center justify-center h-64 border-dashed">
                    <p className="text-slate-500">Upload an image to get started</p>
                </Card>
            )}

            {imageSrc && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="relative">
                             <canvas
                                ref={mainCanvasRef}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                                onClick={handleCanvasClick}
                                className="cursor-crosshair max-w-full h-auto rounded-md border border-slate-700 block"
                            />
                        </div>
                        <div className="mt-4">
                            <a
                                href={imageSrc}
                                download={fileName}
                                className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200 w-full inline-block text-center"
                            >
                                Download Original Image
                            </a>
                        </div>
                    </div>
                    <div className="lg:col-span-1 space-y-4">
                        <Card>
                            <h3 className="text-lg font-semibold text-white mb-2">Live Preview</h3>
                            {hoverColor ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-md border-2 border-slate-600" style={{ backgroundColor: hoverColor.hex }}></div>
                                        <canvas ref={loupeCanvasRef} width={120} height={120} className="rounded-full border-2 border-slate-600"></canvas>
                                    </div>
                                    <ColorInfo label="HEX" value={hoverColor.hex} />
                                    <ColorInfo label="RGB" value={hoverColor.rgb} />
                                    <ColorInfo label="HSL" value={hoverColor.hsl} />
                                </div>
                            ) : (
                                <div className="text-center text-slate-500 py-8">Hover over image</div>
                            )}
                        </Card>
                         <Card>
                             <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold text-white">Picked Colors</h3>
                                {pickedColors.length > 0 && <Button variant="ghost" onClick={() => setPickedColors([])}>Clear</Button>}
                             </div>
                            {pickedColors.length > 0 ? (
                                <div className="grid grid-cols-4 gap-2">
                                    {pickedColors.map(color => (
                                        <PickedColor key={color} color={color} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-slate-500 py-4">Click on the image to save colors</div>
                            )}
                         </Card>
                    </div>
                </div>
            )}
        </ToolContainer>
    );
};
