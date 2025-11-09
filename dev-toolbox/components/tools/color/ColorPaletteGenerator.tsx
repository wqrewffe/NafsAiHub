import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Button } from '../../common/Button';
import { Select } from '../../common/Select';

// HSL based color functions
const hslToHex = (h, s, l) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};

const hexToHsl = (hex) => {
    let r = parseInt(hex.substring(1, 3), 16) / 255;
    let g = parseInt(hex.substring(3, 5), 16) / 255;
    let b = parseInt(hex.substring(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; } 
    else {
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

const generatePalette = (baseHsl, type) => {
    const { h, s, l } = baseHsl;
    const palette = [{h, s, l}];
    switch(type) {
        case 'complementary':
            palette.push({ h: (h + 180) % 360, s, l });
            break;
        case 'analogous':
            palette.push({ h: (h + 30) % 360, s, l }, { h: (h + 330) % 360, s, l });
            break;
        case 'triadic':
            palette.push({ h: (h + 120) % 360, s, l }, { h: (h + 240) % 360, s, l });
            break;
        case 'monochromatic':
            palette.push({ h, s, l: Math.min(100, l + 20) }, { h, s, l: Math.max(0, l - 20) });
            break;
    }
    // Add light/dark shades
    palette.push({ h, s, l: Math.min(100, l + 30) }, { h, s, l: Math.max(0, l - 30) });
    return [...new Set(palette.map(c => hslToHex(c.h,c.s,c.l)))].slice(0, 5);
};

const ColorBlock: React.FC<{ hex: string }> = ({ hex }) => {
    const [isCopied, copyToClipboard] = useCopyToClipboard();
    return (
        <div className="relative group">
            <div className="h-24 rounded" style={{ backgroundColor: hex }}></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
                <Button onClick={() => copyToClipboard(hex)} variant="secondary">{isCopied ? 'Copied!' : 'Copy'}</Button>
            </div>
            <p className="text-center font-mono text-sm mt-2">{hex}</p>
        </div>
    );
}

export const ColorPaletteGenerator: React.FC = () => {
    const [baseColor, setBaseColor] = useState('#4F46E5');
    const [paletteType, setPaletteType] = useState('analogous');

    const palette = useMemo<string[]>(() => {
        const baseHsl = hexToHsl(baseColor);
        return generatePalette(baseHsl, paletteType);
    }, [baseColor, paletteType]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Color Palette Generator"
                description="Create harmonic color palettes from a base color."
            />
            <Card>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <label>Base Color: <input type="color" value={baseColor} onChange={e => setBaseColor(e.target.value.toUpperCase())} /></label>
                    <p className="font-mono text-lg">{baseColor}</p>
                    <Select value={paletteType} onChange={e => setPaletteType(e.target.value)}>
                        <option value="analogous">Analogous</option>
                        <option value="monochromatic">Monochromatic</option>
                        <option value="complementary">Complementary</option>
                        <option value="triadic">Triadic</option>
                    </Select>
                </div>
            </Card>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {palette.map(hex => <ColorBlock key={hex} hex={hex} />)}
            </div>
        </ToolContainer>
    );
};
