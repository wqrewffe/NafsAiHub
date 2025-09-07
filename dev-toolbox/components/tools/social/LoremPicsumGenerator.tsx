import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Select } from '../../common/Select';
import { Loader } from '../../common/Loader';

// Type for image metadata from Picsum API
interface PicsumInfo {
    id: string;
    author: string;
    width: number;
    height: number;
    url: string; // Picsum page URL
    download_url: string; // The direct image URL
}

const ControlSlider: React.FC<{ label: string; value: number; onChange: (v: number) => void; min: number; max: number; unit?: string }> = ({ label, value, onChange, min, max, unit = '' }) => (
    <div>
        <label className="flex justify-between text-sm text-slate-300">
            <span>{label}</span>
            <span>{value}{unit}</span>
        </label>
        <input type="range" value={value} onChange={e => onChange(parseInt(e.target.value))} min={min} max={max} className="w-full" />
    </div>
);

const CodeOutput: React.FC<{ label: string; code: string }> = ({ label, code }) => {
    const [isCopied, copy] = useCopyToClipboard();
    return (
        <div className="relative">
            <Input readOnly value={code} className="font-mono text-sm pr-20" aria-label={label} />
            <Button onClick={() => copy(code)} className="absolute right-2 top-1/2 -translate-y-1/2" variant="secondary">
                {isCopied ? 'Copied!' : 'Copy'}
            </Button>
        </div>
    );
};

export const LoremPicsumGenerator: React.FC = () => {
    // Input settings
    const [width, setWidth] = useState(600);
    const [height, setHeight] = useState(400);
    const [isGrayscale, setIsGrayscale] = useState(false);
    const [blur, setBlur] = useState(0); // 0 to 10
    const [fileFormat, setFileFormat] = useState<'jpg' | 'webp'>('jpg');
    const [idOrSeed, setIdOrSeed] = useState('');
    
    // Control and state
    const [randomizer, setRandomizer] = useState(Date.now());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [imageInfo, setImageInfo] = useState<PicsumInfo | null>(null);

    const imageUrl = useMemo(() => {
        if (!width || !height) return '';

        let url = `https://picsum.photos`;
        const isId = /^\d+$/.test(idOrSeed);

        if (idOrSeed) {
            url += isId ? `/id/${idOrSeed}` : `/seed/${idOrSeed}`;
        }
        
        url += `/${width}/${height}`;

        if (fileFormat === 'webp') {
            url += '.webp';
        }

        const params = new URLSearchParams();
        if (isGrayscale) params.append('grayscale', '');
        if (blur > 0) params.append('blur', String(blur));

        const paramString = params.toString();
        return paramString ? `${url}?${paramString}` : url;
    }, [width, height, isGrayscale, blur, idOrSeed, fileFormat]);

    const fetchImageDetails = useCallback(async () => {
        if (!imageUrl) return;

        setIsLoading(true);
        setError('');
        setImageInfo(null);

        try {
            // We fetch the image URL to get the final redirected URL and the ID from the header
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Could not fetch image. Status: ${response.status}`);
            }
            
            const picsumId = response.headers.get('x-picsum-id');
            if (!picsumId) {
                 // Fallback if header is missing, parse from URL
                 const urlIdMatch = response.url.match(/picsum\.photos\/id\/(\d+)/);
                 if (urlIdMatch && urlIdMatch[1]) {
                     // Found it in the URL, now fetch info
                     const infoResponse = await fetch(`https://picsum.photos/id/${urlIdMatch[1]}/info`);
                     const infoData: PicsumInfo = await infoResponse.json();
                     setImageInfo(infoData);
                 } else {
                    // This happens for seeded images which don't have a static ID
                    setImageInfo({
                        id: 'N/A (Seeded)',
                        author: 'Random Artist',
                        url: '#',
                        download_url: imageUrl,
                        width: width,
                        height: height,
                    });
                 }
            } else {
                 const infoResponse = await fetch(`https://picsum.photos/id/${picsumId}/info`);
                 const infoData: PicsumInfo = await infoResponse.json();
                 setImageInfo(infoData);
            }

        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            setImageInfo(null);
        } finally {
            setIsLoading(false);
        }
    }, [imageUrl, width, height]);

    useEffect(() => {
        // Trigger fetch when any parameter changes
        const handler = setTimeout(() => {
            fetchImageDetails();
        }, 300); // Debounce
        
        return () => clearTimeout(handler);
    }, [fetchImageDetails, randomizer]);
    
    const htmlCode = useMemo(() => `<img src="${imageUrl}" alt="Lorem Picsum placeholder image" width="${width}" height="${height}" />`, [imageUrl, width, height]);
    const markdownCode = useMemo(() => `![Lorem Picsum placeholder image](${imageUrl})`, [imageUrl]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Advanced Lorem Picsum Generator"
                description="Generate specific or random placeholder images with effects, and get image metadata."
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-3">Image Options</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <Input label="Width" type="number" value={width} onChange={e => setWidth(parseInt(e.target.value) || 0)} />
                                <Input label="Height" type="number" value={height} onChange={e => setHeight(parseInt(e.target.value) || 0)} />
                            </div>
                            <Input label="Image ID or Seed" placeholder="Empty for random" value={idOrSeed} onChange={e => setIdOrSeed(e.target.value)} />
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1 block">File Format</label>
                                <Select value={fileFormat} onChange={e => setFileFormat(e.target.value as 'jpg' | 'webp')}>
                                    <option value="jpg">JPG</option>
                                    <option value="webp">WebP</option>
                                </Select>
                            </div>
                            <Button onClick={() => setRandomizer(Date.now())} className="w-full">
                                Randomize Image
                            </Button>
                        </div>
                    </Card>
                     <Card>
                        <h3 className="text-lg font-semibold text-white mb-3">Effects</h3>
                        <div className="space-y-4">
                            <ControlSlider label="Blur" value={blur} onChange={setBlur} min={0} max={10} />
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={isGrayscale} onChange={e => setIsGrayscale(e.target.checked)} className="h-4 w-4 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500"/>
                                <span>Grayscale</span>
                            </label>
                        </div>
                     </Card>
                 </div>
                 <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Preview</h3>
                        <div className="flex items-center justify-center p-4 bg-slate-900 rounded aspect-video">
                            {isLoading && <Loader text="Fetching image..." />}
                            {error && <p className="text-red-400 text-center">{error}</p>}
                            {!isLoading && !error && imageUrl && <img key={imageUrl} src={imageUrl} alt="Picsum Preview" className="max-w-full max-h-full rounded" />}
                        </div>
                        {imageInfo && (
                            <div className="mt-3 text-sm text-slate-400 flex justify-between">
                                <span>ID: <span className="text-white">{imageInfo.id}</span></span>
                                <span>Author: <a href={imageInfo.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{imageInfo.author}</a></span>
                            </div>
                        )}
                    </Card>
                     <Card>
                        <h3 className="text-lg font-semibold text-white mb-3">Generated Code</h3>
                        <div className="space-y-2">
                            <CodeOutput label="Image URL" code={imageUrl} />
                            <CodeOutput label="HTML Tag" code={htmlCode} />
                            <CodeOutput label="Markdown" code={markdownCode} />
                        </div>
                    </Card>
                </div>
            </div>
        </ToolContainer>
    );
};