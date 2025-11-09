import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Button } from '../../common/Button';
import { Select } from '../../common/Select';

export const GradientGenerator: React.FC = () => {
    const [color1, setColor1] = useState('#818CF8');
    const [color2, setColor2] = useState('#38BDF8');
    const [angle, setAngle] = useState(90);
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    const gradientCss = `linear-gradient(${angle}deg, ${color1}, ${color2})`;

    return (
        <ToolContainer>
            <ToolHeader
                title="CSS Gradient Generator"
                description="Create beautiful, copy-pasteable CSS color gradients."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <h3 className="text-lg font-semibold text-white mb-4">Controls</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Color 1</label>
                            <input type="color" value={color1} onChange={e => setColor1(e.target.value)} className="w-full h-10 rounded border-slate-600" />
                            <p className="font-mono text-sm text-slate-400 mt-1">{color1.toUpperCase()}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Color 2</label>
                            <input type="color" value={color2} onChange={e => setColor2(e.target.value)} className="w-full h-10 rounded border-slate-600" />
                            <p className="font-mono text-sm text-slate-400 mt-1">{color2.toUpperCase()}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Angle</label>
                            <input type="range" min="0" max="360" value={angle} onChange={e => setAngle(parseInt(e.target.value))} className="w-full" />
                            <p className="font-mono text-sm text-slate-400 mt-1 text-center">{angle}°</p>
                        </div>
                    </div>
                </Card>
                <div className="md:col-span-2 space-y-4">
                    <Card className="h-64" style={{ background: gradientCss }} />
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">CSS Code</h3>
                        <div className="bg-slate-900 rounded-md p-4 relative">
                            <pre className="text-slate-300 whitespace-pre-wrap break-all"><code>{`background: ${gradientCss};`}</code></pre>
                             <Button
                                onClick={() => copyToClipboard(`background: ${gradientCss};`)}
                                className="absolute top-2 right-2 px-3 py-1 text-sm"
                                variant="secondary"
                            >
                                {isCopied ? 'Copied!' : 'Copy'}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </ToolContainer>
    );
};
