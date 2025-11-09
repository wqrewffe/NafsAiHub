import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

export const GradientTextGenerator: React.FC = () => {
    const [color1, setColor1] = useState('#818CF8');
    const [color2, setColor2] = useState('#F472B6');
    const [angle, setAngle] = useState(45);
    const [text, setText] = useState('Gradient Text');
    const [isCopied, copy] = useCopyToClipboard();

    const cssProperties = useMemo(() => ({
        background: `linear-gradient(${angle}deg, ${color1}, ${color2})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        textFillColor: 'transparent',
    }), [angle, color1, color2]);

    const cssString = `background: ${cssProperties.background};
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
text-fill-color: transparent;`;

    return (
        <ToolContainer>
            <ToolHeader
                title="CSS Gradient Text Generator"
                description="Easily create and preview text with a gradient fill."
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-1 space-y-4">
                    <Card className="space-y-4">
                        <Input value={text} onChange={e => setText(e.target.value)} />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label>Color 1</label>
                                <Input type="color" value={color1} onChange={e => setColor1(e.target.value)} className="h-10 p-1" />
                            </div>
                            <div>
                                <label>Color 2</label>
                                <Input type="color" value={color2} onChange={e => setColor2(e.target.value)} className="h-10 p-1" />
                            </div>
                        </div>
                        <div>
                            <label>Angle: {angle}°</label>
                            <input type="range" min="0" max="360" value={angle} onChange={e => setAngle(parseInt(e.target.value))} className="w-full" />
                        </div>
                    </Card>
                </div>
                 <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Preview</h3>
                        <div className="p-4 bg-slate-800 rounded-md text-center">
                            <p className="text-6xl font-extrabold" style={cssProperties as any}>{text || 'Your Text'}</p>
                        </div>
                    </Card>
                    <Card className="relative">
                         <h3 className="text-lg font-semibold text-white mb-2">CSS Code</h3>
                        <pre className="text-sm bg-slate-900 rounded-md p-4 font-mono whitespace-pre-wrap">
                            <code>{cssString}</code>
                        </pre>
                         <Button onClick={() => copy(cssString)} className="absolute top-4 right-4 text-xs" variant="secondary">{isCopied ? 'Copied!' : 'Copy'}</Button>
                    </Card>
                </div>
            </div>
        </ToolContainer>
    );
};
