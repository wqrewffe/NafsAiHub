import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

const hexToHsl = (hex: string) => {
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

const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    s /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};

const getHarmonies = (hsl: {h: number, s: number, l: number}) => {
    const { h, s, l } = hsl;
    return {
        complementary: [hslToHex((h + 180) % 360, s, l)],
        splitComplementary: [hslToHex((h + 150) % 360, s, l), hslToHex((h + 210) % 360, s, l)],
        triadic: [hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l)],
        tetradic: [hslToHex((h + 90) % 360, s, l), hslToHex((h + 180) % 360, s, l), hslToHex((h + 270) % 360, s, l)],
    };
};

const ColorSwatch: React.FC<{ hex: string }> = ({ hex }) => {
    const [isCopied, copy] = useCopyToClipboard();
    return (
         <div className="text-center">
            <div className="w-full h-16 rounded-md" style={{ backgroundColor: hex }}></div>
            <button onClick={() => copy(hex)} className="font-mono text-sm mt-1 text-slate-400 hover:text-white">
                {isCopied ? 'Copied!' : hex}
            </button>
        </div>
    )
}

const HarmonyRow: React.FC<{ title: string; base: string; colors: string[] }> = ({ title, base, colors }) => (
    <Card>
        <h3 className="text-lg font-semibold text-white capitalize mb-3">{title}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ColorSwatch hex={base} />
            {colors.map(c => <ColorSwatch key={c} hex={c} />)}
        </div>
    </Card>
);


export const ColorHarmonies: React.FC = () => {
    const [baseColor, setBaseColor] = useState('#3B82F6');
    
    const harmonies = useMemo(() => getHarmonies(hexToHsl(baseColor)), [baseColor]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Color Harmony Calculator"
                description="Find colors that work well together based on color theory principles."
            />
            <Card className="text-center">
                 <label className="block text-lg font-medium text-slate-300 mb-2">Base Color</label>
                 <div className="inline-flex items-center gap-4 bg-slate-800 p-2 rounded-lg">
                    <Input type="color" value={baseColor} onChange={e => setBaseColor(e.target.value.toUpperCase())} className="w-16 h-16 p-1" />
                    <Input value={baseColor} onChange={e => setBaseColor(e.target.value.toUpperCase())} className="font-mono w-32" />
                 </div>
            </Card>

            <div className="space-y-4">
                <HarmonyRow title="Complementary" base={baseColor} colors={harmonies.complementary} />
                <HarmonyRow title="Split Complementary" base={baseColor} colors={harmonies.splitComplementary} />
                <HarmonyRow title="Triadic" base={baseColor} colors={harmonies.triadic} />
                <HarmonyRow title="Tetradic (Square)" base={baseColor} colors={harmonies.tetradic} />
            </div>
        </ToolContainer>
    );
};
