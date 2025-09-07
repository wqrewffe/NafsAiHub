import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};
const rgbToHex = (r: number, g: number, b: number) => "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
const mixColor = (color1: number, color2: number, weight: number) => Math.round(color2 * weight + color1 * (1 - weight));

const generateShades = (hex: string) => {
    const baseRgb = hexToRgb(hex);
    if (!baseRgb) return {};
    
    const shades: Record<string, string> = { '500': hex };
    const steps = ['50', '100', '200', '300', '400', '600', '700', '800', '900'];
    
    // Generate lighter shades (tints)
    for (let i = 4; i >= 0; i--) {
        const weight = (4 - i) * 0.2 + 0.1; // Adjust weight for better distribution
        shades[steps[i]] = rgbToHex(
            mixColor(baseRgb.r, 255, weight),
            mixColor(baseRgb.g, 255, weight),
            mixColor(baseRgb.b, 255, weight)
        );
    }
    
    // Generate darker shades
    for (let i = 5; i < 9; i++) {
        const weight = (i - 4) * 0.15; // Adjust weight
         shades[steps[i]] = rgbToHex(
            mixColor(baseRgb.r, 0, weight),
            mixColor(baseRgb.g, 0, weight),
            mixColor(baseRgb.b, 0, weight)
        );
    }
    
    return shades;
};

const ShadeRow: React.FC<{ name: string; hex: string }> = ({ name, hex }) => {
    const [isCopied, copy] = useCopyToClipboard();
    return (
        <div className="flex items-center gap-4">
            <div className="w-12 text-right text-slate-400 text-sm">{name}</div>
            <div className="w-12 h-12 rounded" style={{ backgroundColor: hex }}></div>
            <button onClick={() => copy(hex)} className="font-mono text-slate-300 hover:text-white">{hex}</button>
            {isCopied && <span className="text-green-400 text-xs">Copied!</span>}
        </div>
    );
};

export const TailwindShadeGenerator: React.FC = () => {
    const [baseColor, setBaseColor] = useState('#3B82F6');
    
    const shades = useMemo(() => generateShades(baseColor), [baseColor]);
    const shadeOrder = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

    return (
        <ToolContainer>
            <ToolHeader
                title="Tailwind Shade Generator"
                description="Generate a 10-step color palette (50-900) from a single base color."
            />
             <Card className="text-center">
                 <label className="block text-lg font-medium text-slate-300 mb-2">Base Color (500)</label>
                 <div className="inline-flex items-center gap-4 bg-slate-800 p-2 rounded-lg">
                    <Input type="color" value={baseColor} onChange={e => setBaseColor(e.target.value.toUpperCase())} className="w-16 h-16 p-1" />
                    <Input value={baseColor} onChange={e => setBaseColor(e.target.value.toUpperCase())} className="font-mono w-32" />
                 </div>
            </Card>
            <Card>
                <div className="space-y-2">
                {shadeOrder.map(name => (
                    shades[name] && <ShadeRow key={name} name={name} hex={shades[name]} />
                ))}
                </div>
            </Card>
        </ToolContainer>
    );
};
