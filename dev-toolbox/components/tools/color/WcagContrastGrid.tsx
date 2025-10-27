import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Card } from '../../common/Card';

const getLuminance = (hex: string): number => {
    hex = hex.replace('#', '');
    const rgb = parseInt(hex, 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = ((rgb >> 0) & 0xff) / 255;
    const sRGB = [r, g, b].map(val => (val <= 0.03928) ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4));
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
};

const getContrastRatio = (color1: string, color2: string): number => {
    try {
        const lum1 = getLuminance(color1);
        const lum2 = getLuminance(color2);
        return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
    } catch {
        return 1;
    }
};

const getRating = (ratio: number): { aa: boolean, aaa: boolean } => ({
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
});

const isValidHex = (color: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);

export const WcagContrastGrid: React.FC = () => {
    const [foregrounds, setForegrounds] = useState('#FFFFFF\n#000000');
    const [backgrounds, setBackgrounds] = useState('#3B82F6\n#EF4444\n#10B981');

    const { fgColors, bgColors } = useMemo(() => ({
        fgColors: foregrounds.split('\n').map(c => c.trim()).filter(isValidHex),
        bgColors: backgrounds.split('\n').map(c => c.trim()).filter(isValidHex)
    }), [foregrounds, backgrounds]);
    
    return (
        <ToolContainer>
            <ToolHeader
                title="WCAG Contrast Grid"
                description="Test multiple color combinations at once to build accessible palettes."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FIX: Replaced invalid `label` prop with a proper <label> element. */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Foreground Colors</label>
                    <Textarea placeholder="One HEX code per line..." value={foregrounds} onChange={e => setForegrounds(e.target.value)} rows={8} />
                </div>
                {/* FIX: Replaced invalid `label` prop with a proper <label> element. */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Background Colors</label>
                    <Textarea placeholder="One HEX code per line..." value={backgrounds} onChange={e => setBackgrounds(e.target.value)} rows={8} />
                </div>
            </div>

            <Card className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2 border-b border-r border-slate-700"></th>
                            {bgColors.map(bg => (
                                <th key={bg} className="p-2 border-b border-slate-700">
                                    <div className="w-16 h-8 rounded" style={{ backgroundColor: bg }}></div>
                                    <span className="font-mono text-xs">{bg}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {fgColors.map(fg => (
                            <tr key={fg}>
                                <td className="p-2 border-r border-slate-700">
                                    <div className="w-16 h-8 rounded" style={{ backgroundColor: fg }}></div>
                                    <span className="font-mono text-xs">{fg}</span>
                                </td>
                                {bgColors.map(bg => {
                                    const ratio = getContrastRatio(fg, bg);
                                    const { aa, aaa } = getRating(ratio);
                                    return (
                                        <td key={`${fg}-${bg}`} className="text-center p-2" style={{ backgroundColor: bg, color: fg }}>
                                            <div className="font-bold text-lg">{ratio.toFixed(2)}</div>
                                            <div className="text-xs">
                                                <span className={aa ? 'text-green-400' : 'text-red-400'}>AA</span> / <span className={aaa ? 'text-green-400' : 'text-red-400'}>AAA</span>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </ToolContainer>
    );
};