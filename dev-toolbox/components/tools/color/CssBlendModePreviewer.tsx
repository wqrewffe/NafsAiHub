import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Select } from '../../common/Select';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

const blendModes: BlendMode[] = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];
const imageUrl = "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?auto=format&fit=crop&w=600&q=80";

export const CssBlendModePreviewer: React.FC = () => {
    const [blendMode, setBlendMode] = useState<BlendMode>('overlay');
    const [bgColor, setBgColor] = useState('#be185d'); // Pink-700
    const [isCopied, copy] = useCopyToClipboard();
    
    const previewStyle = {
        backgroundColor: bgColor,
        backgroundImage: `url(${imageUrl})`,
        backgroundBlendMode: blendMode,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };
    
    const cssCode = `background-color: ${bgColor};
background-image: url(...);
background-blend-mode: ${blendMode};`;

    return (
        <ToolContainer>
            <ToolHeader title="CSS Blend Mode Previewer" description="See how different background-blend-mode values work with an image and a background color." />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Controls</h3>
                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-1 block">Blend Mode</label>
                            <Select value={blendMode} onChange={e => setBlendMode(e.target.value as BlendMode)}>
                                {blendModes.map(mode => <option key={mode} value={mode} className="capitalize">{mode}</option>)}
                            </Select>
                        </div>
                         <div>
                            <label className="text-sm font-medium text-slate-300 mb-1 block">Background Color</label>
                            <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-full h-10 rounded border-slate-600 p-1" />
                        </div>
                    </Card>
                    <Card className="relative">
                        <h3 className="text-lg font-semibold text-white mb-2">CSS Code</h3>
                        <pre className="text-sm bg-slate-900 rounded-md p-4 font-mono whitespace-pre-wrap">
                            <code>{cssCode}</code>
                        </pre>
                        <Button onClick={() => copy(cssCode)} className="absolute top-4 right-4 text-xs" variant="secondary">{isCopied ? 'Copied!' : 'Copy'}</Button>
                    </Card>
                </div>
                <Card className="lg:col-span-2">
                    <h3 className="text-lg font-semibold text-white mb-2">Preview</h3>
                    <div className="w-full h-96 rounded-md border-2 border-slate-700" style={previewStyle as React.CSSProperties}></div>
                </Card>
            </div>
        </ToolContainer>
    );
};