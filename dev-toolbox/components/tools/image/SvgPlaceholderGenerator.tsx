import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

export const SvgPlaceholderGenerator: React.FC = () => {
    const [width, setWidth] = useState(300);
    const [height, setHeight] = useState(200);
    const [bgColor, setBgColor] = useState('#64748B'); // slate-500
    const [textColor, setTextColor] = useState('#F8FAFC'); // slate-50
    const [text, setText] = useState('300x200');

    const [isCodeCopied, copyCode] = useCopyToClipboard();
    const [isUrlCopied, copyUrl] = useCopyToClipboard();

    const svgCode = useMemo(() => {
        const fontSize = Math.min(width / 5, height / 3, 48);
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect fill="${bgColor}" width="${width}" height="${height}"/>
  <text fill="${textColor}" font-family="sans-serif" font-size="${fontSize}" dy="0.35em" font-weight="bold" text-anchor="middle" x="50%" y="50%">${text}</text>
</svg>`;
    }, [width, height, bgColor, textColor, text]);
    
    const dataUrl = useMemo(() => `data:image/svg+xml;base64,${btoa(svgCode)}`, [svgCode]);

    const handleDownload = () => {
        const blob = new Blob([svgCode], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `placeholder-${width}x${height}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    };


    return (
        <ToolContainer>
            <ToolHeader
                title="SVG Placeholder Generator"
                description="Create simple, customizable SVG placeholders for your mockups and designs."
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
                            <img src={dataUrl} alt="SVG Placeholder Preview" />
                        </div>
                    </Card>
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">SVG Code</h3>
                        <pre className="text-xs bg-slate-900 rounded p-2 overflow-auto font-mono">{svgCode}</pre>
                    </Card>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                         <Button onClick={() => copyCode(svgCode)} variant="secondary">{isCodeCopied ? 'Copied!' : 'Copy Code'}</Button>
                         <Button onClick={() => copyUrl(dataUrl)} variant="secondary">{isUrlCopied ? 'Copied!' : 'Copy Data URL'}</Button>
                         <Button onClick={handleDownload}>Download SVG</Button>
                    </div>
                </div>
            </div>
        </ToolContainer>
    );
};
