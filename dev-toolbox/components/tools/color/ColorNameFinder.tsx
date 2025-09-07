import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { colorNameList } from '../../../services/colorNameService';

const hexToRgb = (hex: string): { r: number, g: number, b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

const findClosestColor = (hex: string) => {
    const inputRgb = hexToRgb(hex);
    if (!inputRgb) return null;

    let closest = { name: '', hex: '', distance: Infinity };

    colorNameList.forEach(color => {
        const colorRgb = hexToRgb(color.hex);
        if (colorRgb) {
            const distance = Math.sqrt(
                Math.pow(inputRgb.r - colorRgb.r, 2) +
                Math.pow(inputRgb.g - colorRgb.g, 2) +
                Math.pow(inputRgb.b - colorRgb.b, 2)
            );
            if (distance < closest.distance) {
                closest = { name: color.name, hex: color.hex, distance };
            }
        }
    });

    return closest;
};

export const ColorNameFinder: React.FC = () => {
    const [color, setColor] = useState('#3B82F6'); // blue-500
    
    const closestColor = useMemo(() => findClosestColor(color), [color]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Color Name Finder"
                description="Find the closest human-readable name for any color code."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Pick a color</label>
                    <div className="flex items-center gap-4">
                         <Input type="color" value={color} onChange={e => setColor(e.target.value.toUpperCase())} className="w-16 h-16 p-1" />
                         <Input value={color} onChange={e => setColor(e.target.value.toUpperCase())} className="font-mono" />
                    </div>
                </Card>
                {closestColor && (
                    <Card className="flex items-center justify-center text-center">
                        <div>
                            <p className="text-4xl font-bold" style={{ color: closestColor.hex }}>{closestColor.name}</p>
                            <p className="font-mono text-slate-400 mt-2">{closestColor.hex}</p>
                        </div>
                    </Card>
                )}
            </div>
        </ToolContainer>
    );
};
