
import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';

const getLuminance = (hex) => {
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

const getContrastRatio = (color1, color2) => {
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const ratio = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
    return ratio.toFixed(2);
};

const ContrastResult: React.FC<{ label: string; pass: boolean }> = ({ label, pass }) => (
    <div className={`flex items-center justify-between p-2 rounded ${pass ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
        <span className={pass ? 'text-green-300' : 'text-red-300'}>{label}</span>
        <span className={`font-bold ${pass ? 'text-green-300' : 'text-red-300'}`}>{pass ? 'PASS' : 'FAIL'}</span>
    </div>
);


export const ContrastChecker: React.FC = () => {
    const [textColor, setTextColor] = useState('#FFFFFF');
    const [bgColor, setBgColor] = useState('#4F46E5');

    const contrastRatio = useMemo(() => parseFloat(getContrastRatio(textColor, bgColor)), [textColor, bgColor]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Color Contrast Checker"
                description="Check if your text and background colors meet WCAG accessibility standards."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Text Color</label>
                        <input type="color" value={textColor} onChange={e => setTextColor(e.target.value.toUpperCase())} className="w-full h-10 rounded border-slate-600" />
                        <p className="font-mono text-sm text-slate-400 mt-1">{textColor}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Background Color</label>
                        <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value.toUpperCase())} className="w-full h-10 rounded border-slate-600" />
                        <p className="font-mono text-sm text-slate-400 mt-1">{bgColor}</p>
                    </div>
                </Card>

                <div className="md:col-span-2 space-y-4">
                    <Card style={{ backgroundColor: bgColor, color: textColor }} className="h-40 flex flex-col items-center justify-center">
                        <p className="text-3xl font-bold">Example Text</p>
                        <p>This is how it looks.</p>
                    </Card>
                    <Card>
                        <div className="text-center mb-4">
                            <p className="text-slate-400">Contrast Ratio</p>
                            <p className="text-4xl sm:text-5xl font-bold text-white">{contrastRatio}</p>
                        </div>
                        <div className="space-y-2">
                           <ContrastResult label="Normal Text (AA)" pass={contrastRatio >= 4.5} />
                           <ContrastResult label="Large Text (AA)" pass={contrastRatio >= 3} />
                           <ContrastResult label="Normal Text (AAA)" pass={contrastRatio >= 7} />
                           <ContrastResult label="Large Text (AAA)" pass={contrastRatio >= 4.5} />
                        </div>
                    </Card>
                </div>
            </div>
        </ToolContainer>
    );
};
