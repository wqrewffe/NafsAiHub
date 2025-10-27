
import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

export const PlaceholderImageGenerator: React.FC = () => {
    const [width, setWidth] = useState(600);
    const [height, setHeight] = useState(400);
    const [bgColor, setBgColor] = useState('#CBD5E1'); // slate-300
    const [textColor, setTextColor] = useState('#475569'); // slate-600
    const [text, setText] = useState('600x400');
    
    const [isCopied, copyUrl] = useCopyToClipboard();

    const imageUrl = useMemo(() => {
        const cleanBg = bgColor.replace('#', '');
        const cleanText = textColor.replace('#', '');
        const encodedText = encodeURIComponent(text);
        return `https://placehold.co/${width}x${height}/${cleanBg}/${cleanText}?text=${encodedText}`;
    }, [width, height, bgColor, textColor, text]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Placeholder Image Generator"
                description="Quickly generate placeholder images for your designs and mockups."
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 space-y-4">
                     <h3 className="text-lg font-semibold text-white">Options</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-sm">Width</label>
                            <Input type="number" value={width} onChange={e => setWidth(parseInt(e.target.value))} />
                        </div>
                        <div>
                            <label className="text-sm">Height</label>
                            <Input type="number" value={height} onChange={e => setHeight(parseInt(e.target.value))} />
                        </div>
                    </div>
                     <div>
                        <label className="text-sm">Text</label>
                        <Input type="text" value={text} onChange={e => setText(e.target.value)} />
                    </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-sm">Background</label>
                            <Input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="h-10 p-1" />
                        </div>
                        <div>
                            <label className="text-sm">Text Color</label>
                            <Input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="h-10 p-1" />
                        </div>
                    </div>
                </Card>
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Preview</h3>
                        <div className="flex items-center justify-center p-4 bg-slate-900 rounded">
                            <img src={imageUrl} alt="Placeholder Preview" className="max-w-full" />
                        </div>
                    </Card>
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Image URL</h3>
                        <div className="relative">
                            <Input readOnly value={imageUrl} className="font-mono text-sm pr-20" />
                             <Button onClick={() => copyUrl(imageUrl)} className="absolute right-2 top-1/2 -translate-y-1/2" variant="secondary">
                                {isCopied ? 'Copied!' : 'Copy'}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </ToolContainer>
    );
};
