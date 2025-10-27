import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { Select } from '../../common/Select';

export const SVGConverter: React.FC = () => {
    const [svgString, setSvgString] = useState('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" /></svg>');
    const [format, setFormat] = useState<'png' | 'jpeg'>('png');
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "image/svg+xml") {
            const reader = new FileReader();
            reader.onload = (event) => {
                setSvgString(event.target?.result as string);
                setError('');
            };
            reader.onerror = () => setError('Failed to read the SVG file.');
            reader.readAsText(file);
        } else {
            setError('Please upload a valid .svg file.');
        }
    };

    const handleDownload = () => {
        setError('');
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            
            const mimeType = `image/${format}`;
            const dataUrl = canvas.toDataURL(mimeType);

            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `converted.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };
        img.onerror = () => {
            setError('Could not parse SVG. Check the code for errors.');
            URL.revokeObjectURL(url);
        };
        img.src = url;
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="SVG Converter"
                description="Convert SVG code or files to PNG or JPEG formats."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-white mb-2 block">Upload .svg file</label>
                         <input
                            type="file"
                            accept="image/svg+xml"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                        />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-white mb-2 block">Or paste SVG code</label>
                        <Textarea
                            value={svgString}
                            onChange={(e) => setSvgString(e.target.value)}
                            rows={10}
                            className="font-mono text-sm"
                            placeholder="<svg>...</svg>"
                        />
                    </div>
                </Card>
                <div className="space-y-4">
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Preview</h3>
                        <div className="p-4 bg-white rounded-md border border-slate-700 min-h-[200px] flex items-center justify-center">
                            <div dangerouslySetInnerHTML={{ __html: svgString }} />
                        </div>
                    </Card>
                     <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Export</h3>
                        <div className="flex items-center gap-4">
                            <Select value={format} onChange={e => setFormat(e.target.value as 'png' | 'jpeg')}>
                                <option value="png">PNG</option>
                                <option value="jpeg">JPEG</option>
                            </Select>
                            <Button onClick={handleDownload} disabled={!svgString.trim()}>Download</Button>
                        </div>
                    </Card>
                    {error && <p className="text-red-400 text-center">{error}</p>}
                </div>
            </div>
        </ToolContainer>
    );
};