
import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

const rgbToHex = (r: number, g: number, b: number) => "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();

const blendColors = (color1: string, color2: string, steps: number): string[] => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);

    if (!rgb1 || !rgb2) return [];

    const blended: string[] = [color1];
    for (let i = 1; i < steps - 1; i++) {
        const ratio = i / (steps - 1);
        const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
        const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
        const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);
        blended.push(rgbToHex(r, g, b));
    }
    blended.push(color2);
    return blended;
};

const ColorSwatch: React.FC<{ color: string }> = ({ color }) => {
    const [isCopied, copy] = useCopyToClipboard();
    return (
        <div 
            className="h-16 w-full rounded-md flex items-center justify-center cursor-pointer group"
            style={{ backgroundColor: color }}
            onClick={() => copy(color)}
        >
             <span className="font-mono text-white bg-black/40 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {isCopied ? 'Copied!' : color}
            </span>
        </div>
    );
};

export const ColorBlender: React.FC = () => {
    const [color1, setColor1] = useState('#FDE68A'); // Light Yellow
    const [color2, setColor2] = useState('#6D28D9'); // Deep Purple
    const [steps, setSteps] = useState(7);

    const palette = useMemo(() => blendColors(color1, color2, steps), [color1, color2, steps]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Color Blender"
                description="Create a seamless color palette by mixing two colors together."
            />
            <Card>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <div className="text-center">
                        <label className="block text-sm font-medium text-slate-300 mb-1">Color 1</label>
                        <input type="color" value={color1} onChange={e => setColor1(e.target.value.toUpperCase())} className="w-24 h-24 rounded-lg border-4 border-slate-700" />
                        <p className="font-mono mt-2">{color1}</p>
                    </div>
                     <div className="text-center">
                        <label className="block text-sm font-medium text-slate-300 mb-1">Steps: {steps}</label>
                        <input type="range" min="3" max="20" value={steps} onChange={e => setSteps(parseInt(e.target.value, 10))} className="w-48" />
                    </div>
                    <div className="text-center">
                        <label className="block text-sm font-medium text-slate-300 mb-1">Color 2</label>
                        <input type="color" value={color2} onChange={e => setColor2(e.target.value.toUpperCase())} className="w-24 h-24 rounded-lg border-4 border-slate-700" />
                        <p className="font-mono mt-2">{color2}</p>
                    </div>
                </div>
            </Card>
            <Card>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-2">
                    {palette.map(color => <ColorSwatch key={color} color={color} />)}
                </div>
            </Card>
        </ToolContainer>
    );
};
