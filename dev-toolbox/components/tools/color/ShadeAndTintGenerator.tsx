import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

// Helper functions (could be moved to a shared utils file)
const hexToRgb = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }
    return { r, g, b };
};
const rgbToHex = (r: number, g: number, b: number) => "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
const mixColor = (color1: number, color2: number, weight: number) => Math.round(color2 * weight + color1 * (1 - weight));

const generateShadesAndTints = (hex: string, count: number) => {
    const baseRgb = hexToRgb(hex);
    const tints = [];
    const shades = [];
    const step = 1 / (count + 1);

    for (let i = 1; i <= count; i++) {
        const weight = i * step;
        // Mix with white for tints
        tints.push(rgbToHex(
            mixColor(baseRgb.r, 255, weight),
            mixColor(baseRgb.g, 255, weight),
            mixColor(baseRgb.b, 255, weight)
        ));
        // Mix with black for shades
        shades.push(rgbToHex(
            mixColor(baseRgb.r, 0, weight),
            mixColor(baseRgb.g, 0, weight),
            mixColor(baseRgb.b, 0, weight)
        ));
    }
    return { tints, shades };
};

const ColorBox: React.FC<{ hex: string }> = ({ hex }) => {
    const [isCopied, copy] = useCopyToClipboard();
    return (
        <div className="relative group w-full h-16 rounded cursor-pointer" style={{ backgroundColor: hex }} onClick={() => copy(hex)}>
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-xs font-mono">{isCopied ? 'Copied!' : hex}</span>
            </div>
        </div>
    );
};

export const ShadeAndTintGenerator: React.FC = () => {
    const [baseColor, setBaseColor] = useState('#4F46E5');
    const [count, setCount] = useState(8);

    const { tints, shades } = useMemo(() => generateShadesAndTints(baseColor, count), [baseColor, count]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Shade & Tint Generator"
                description="Generate a range of lighter (tints) and darker (shades) variations of a base color."
            />
            <Card>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Base Color</label>
                        <input type="color" value={baseColor} onChange={e => setBaseColor(e.target.value.toUpperCase())} className="w-24 h-24 rounded-lg border-4 border-slate-700" />
                        <p className="font-mono text-center mt-2">{baseColor}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Steps: {count}</label>
                        <input type="range" min="3" max="12" value={count} onChange={e => setCount(parseInt(e.target.value))} className="w-48" />
                    </div>
                </div>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-semibold text-white mb-3">Tints (Lighter)</h3>
                    <div className="flex flex-col gap-2">
                        {tints.map(color => <ColorBox key={color} hex={color} />)}
                    </div>
                </Card>
                 <Card>
                    <h3 className="text-lg font-semibold text-white mb-3">Shades (Darker)</h3>
                    <div className="flex flex-col gap-2">
                        {shades.map(color => <ColorBox key={color} hex={color} />)}
                    </div>
                </Card>
            </div>
        </ToolContainer>
    );
};