import React, { useState, useEffect } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

// Color conversion functions
function hexToRgb(hex: string) {
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
}

function rgbToHex(r: number, g: number, b: number) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number) {
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
}

function hslToRgb(h: number, s: number, l: number) {
    s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h >= 0 && h < 60) { [r, g, b] = [c, x, 0]; }
    else if (h >= 60 && h < 120) { [r, g, b] = [x, c, 0]; }
    else if (h >= 120 && h < 180) { [r, g, b] = [0, c, x]; }
    else if (h >= 180 && h < 240) { [r, g, b] = [0, x, c]; }
    else if (h >= 240 && h < 300) { [r, g, b] = [x, 0, c]; }
    else if (h >= 300 && h < 360) { [r, g, b] = [c, 0, x]; }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return { r, g, b };
}


export const ColorConverter: React.FC = () => {
    const [color, setColor] = useState("#4F46E5");
    const [hex, setHex] = useState("#4F46E5");
    const [rgb, setRgb] = useState({ r: 79, g: 70, b: 229 });
    const [hsl, setHsl] = useState({ h: 244, s: 76, l: 59 });
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    const updateFromHex = (newHex: string) => {
        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newHex)) {
            const newRgb = hexToRgb(newHex);
            const newHsl = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);
            setColor(newHex);
            setHex(newHex);
            setRgb(newRgb);
            setHsl(newHsl);
        } else {
            setHex(newHex);
        }
    };

    const updateFromRgb = (r: number, g: number, b: number) => {
        const newHex = rgbToHex(r, g, b);
        const newHsl = rgbToHsl(r, g, b);
        setColor(newHex);
        setHex(newHex);
        setRgb({r,g,b});
        setHsl(newHsl);
    };

    const updateFromHsl = (h: number, s: number, l: number) => {
        const newRgb = hslToRgb(h, s, l);
        const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        setColor(newHex);
        setHex(newHex);
        setRgb(newRgb);
        setHsl({h,s,l});
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="Color Converter"
                description="Convert colors between HEX, RGB, and HSL formats."
            />
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => updateFromHex(e.target.value.toUpperCase())}
                        className="w-48 h-48 rounded-lg border-4 border-slate-700 cursor-pointer"
                        aria-label="Color Picker"
                    />
                </div>
                <div className="flex-grow space-y-4">
                    <Card>
                        <label className="block text-sm font-medium text-slate-300">HEX</label>
                        <Input value={hex} onChange={e => updateFromHex(e.target.value.toUpperCase())} className="font-mono" />
                    </Card>
                    <Card>
                        <label className="block text-sm font-medium text-slate-300">RGB</label>
                        <div className="flex gap-2">
                             <Input type="number" value={rgb.r} onChange={e => updateFromRgb(parseInt(e.target.value), rgb.g, rgb.b)} className="font-mono" />
                             <Input type="number" value={rgb.g} onChange={e => updateFromRgb(rgb.r, parseInt(e.target.value), rgb.b)} className="font-mono" />
                             <Input type="number" value={rgb.b} onChange={e => updateFromRgb(rgb.r, rgb.g, parseInt(e.target.value))} className="font-mono" />
                        </div>
                    </Card>
                    <Card>
                        <label className="block text-sm font-medium text-slate-300">HSL</label>
                         <div className="flex gap-2">
                             <Input type="number" value={hsl.h} onChange={e => updateFromHsl(parseInt(e.target.value), hsl.s, hsl.l)} className="font-mono" />
                             <Input type="number" value={hsl.s} onChange={e => updateFromHsl(hsl.h, parseInt(e.target.value), hsl.l)} className="font-mono" />
                             <Input type="number" value={hsl.l} onChange={e => updateFromHsl(hsl.h, hsl.s, parseInt(e.target.value))} className="font-mono" />
                        </div>
                    </Card>
                </div>
            </div>
        </ToolContainer>
    );
};
