import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.substring(1), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = ((rgb >> 0) & 0xff) / 255;
    
    const sRGB = [r, g, b].map(val => {
        if (val <= 0.03928) return val / 12.92;
        return Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
};

const getContrastRatio = (color1: string, color2: string): number => {
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
};

// Simplified suggestion logic
const suggestColors = (baseColor: string) => {
    const suggestions = {
        aa: [] as string[],
        aaa: [] as string[],
    };
    
    // Check against black and white first
    if (getContrastRatio(baseColor, '#FFFFFF') >= 7) suggestions.aaa.push('#FFFFFF');
    else if (getContrastRatio(baseColor, '#FFFFFF') >= 4.5) suggestions.aa.push('#FFFFFF');
    
    if (getContrastRatio(baseColor, '#000000') >= 7) suggestions.aaa.push('#000000');
    else if (getContrastRatio(baseColor, '#000000') >= 4.5) suggestions.aa.push('#000000');

    // Generate shades of gray
    for (let i = 1; i < 10; i++) {
        const grayVal = Math.round(255 * (i / 10)).toString(16).padStart(2, '0');
        const grayHex = `#${grayVal}${grayVal}${grayVal}`;
        if (getContrastRatio(baseColor, grayHex) >= 7) suggestions.aaa.push(grayHex);
        else if (getContrastRatio(baseColor, grayHex) >= 4.5) suggestions.aa.push(grayHex);
    }
    
    suggestions.aa = [...new Set(suggestions.aa)];
    suggestions.aaa = [...new Set(suggestions.aaa)];

    return suggestions;
};

const SuggestionBox: React.FC<{ title: string; colors: string[]; baseColor: string }> = ({ title, colors, baseColor }) => (
    <Card>
        <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
        {colors.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {colors.map(color => <ColorSuggestion key={color} color={color} baseColor={baseColor} />)}
            </div>
        ) : <p className="text-slate-500 text-sm">No direct suggestions. Try adjusting the base color.</p>}
    </Card>
);

const ColorSuggestion: React.FC<{ color: string; baseColor: string }> = ({ color, baseColor }) => {
    const [isCopied, copy] = useCopyToClipboard();
    return (
        <div 
            onClick={() => copy(color)}
            className="p-2 rounded-md cursor-pointer border-2 border-transparent hover:border-indigo-500"
            style={{ backgroundColor: baseColor, color: color }}
        >
            <p className="font-mono text-center text-sm">{color}</p>
            <p className="text-center text-xs">{isCopied ? 'Copied!' : 'Copy'}</p>
        </div>
    );
};

export const AccessibleColorSuggester: React.FC = () => {
    const [baseColor, setBaseColor] = useState('#4338CA'); // Indigo-700
    
    const suggestions = useMemo(() => suggestColors(baseColor), [baseColor]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Accessible Color Suggester"
                description="Find accessible text colors that meet WCAG standards for a given background color."
            />
            <Card className="text-center">
                 <label className="block text-lg font-medium text-slate-300 mb-2">Background Color</label>
                 <div className="inline-flex items-center gap-4 bg-slate-800 p-2 rounded-lg">
                    <Input type="color" value={baseColor} onChange={e => setBaseColor(e.target.value.toUpperCase())} className="w-16 h-16 p-1" />
                    <Input value={baseColor} onChange={e => setBaseColor(e.target.value.toUpperCase())} className="font-mono w-32" />
                 </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SuggestionBox title="WCAG AA Suggestions (Ratio >= 4.5)" colors={suggestions.aa} baseColor={baseColor} />
                <SuggestionBox title="WCAG AAA Suggestions (Ratio >= 7.0)" colors={suggestions.aaa} baseColor={baseColor} />
            </div>
        </ToolContainer>
    );
};
