import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Input } from '../../common/Input';
import { Select } from '../../common/Select';
import { Loader } from '../../common/Loader';

const CHAR_SETS = {
    simple: " .:-=+*#%@",
    detailed: "`.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@",
    blocks: " ░▒▓█",
};

type CharSet = keyof typeof CHAR_SETS | 'custom';
type RenderMode = 'text' | 'html';

const ControlSlider: React.FC<{ label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; unit?: string }> = ({ label, value, onChange, min, max, step = 1, unit = '' }) => (
    <div>
        <label className="flex justify-between text-sm"><span>{label}</span><span>{value}{unit}</span></label>
        <input type="range" value={value} onChange={e => onChange(parseInt(e.target.value))} min={min} max={max} step={step} className="w-full" />
    </div>
);

const renderAsciiHtml = (htmlArt: { char: string; color: string }[][]) => {
    return (
        <div className="font-mono leading-tight text-xs" style={{ backgroundColor: '#111827' }}>
            {htmlArt.map((row, i) => (
                <div key={i} className="flex" style={{whiteSpace: 'pre'}}>
                    {row.map((pixel, j) => (
                        <span key={j} style={{ color: pixel.color }}>
                            {pixel.char}
                        </span>
                    ))}
                </div>
            ))}
        </div>
    );
};

export const ImageToAscii: React.FC = () => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [asciiArt, setAsciiArt] = useState<{ text: string; html: { char: string; color: string }[][] }>({ text: '', html: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [isCopiedText, copyText] = useCopyToClipboard();
    const [isCopiedHtml, copyHtml] = useCopyToClipboard();
    
    // Options
    const [renderMode, setRenderMode] = useState<RenderMode>('html');
    const [charset, setCharset] = useState<CharSet>('detailed');
    const [customCharset, setCustomCharset] = useState('CUSTOM');
    const [isReversed, setIsReversed] = useState(false);
    const [width, setWidth] = useState(120);
    const [height, setHeight] = useState(66);
    const [aspectRatio, setAspectRatio] = useState(1);
    const [aspectRatioLocked, setAspectRatioLocked] = useState(true);
    const [lastChanged, setLastChanged] = useState<'width'|'height'>('width');
    const [contrast, setContrast] = useState(100);
    const [brightness, setBrightness] = useState(100);

    // Export Options
    const [pngBgColor, setPngBgColor] = useState('#111827');
    const [pngTextColor, setPngTextColor] = useState('#F9FAFB');
    const [pngFontSize, setPngFontSize] = useState(10);


    const canvasRef = useRef<HTMLCanvasElement>(null);
    const outputRef = useRef<HTMLDivElement>(null);

    const activeCharset = useMemo(() => {
        const selected = charset === 'custom' ? customCharset : CHAR_SETS[charset];
        return isReversed ? selected.split('').reverse().join('') : selected;
    }, [charset, customCharset, isReversed]);
    
    // --- Aspect Ratio Handling ---
    useEffect(() => {
        if (!aspectRatioLocked || aspectRatio === 0 || lastChanged !== 'width') return;
        const newHeight = Math.round(width * aspectRatio * 0.55); // Adjust for character aspect ratio
        if(height !== newHeight) setHeight(newHeight);
    }, [width, aspectRatioLocked, lastChanged, aspectRatio]);

    useEffect(() => {
        if (!aspectRatioLocked || aspectRatio === 0 || lastChanged !== 'height') return;
        const newWidth = Math.round(height / (aspectRatio * 0.55));
        if(width !== newWidth) setWidth(newWidth);
    }, [height, aspectRatioLocked, lastChanged, aspectRatio]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const src = event.target?.result as string;
                const img = new Image();
                img.onload = () => {
                    setAspectRatio(img.height / img.width);
                    const newHeight = Math.round(width * (img.height / img.width) * 0.55);
                    setHeight(newHeight);
                }
                img.src = src;
                setImageSrc(src);
            };
            reader.readAsDataURL(file);
        }
    };

    // --- Main ASCII Generation Effect ---
    useEffect(() => {
        if (!imageSrc || !canvasRef.current || !activeCharset || width <= 0 || height <= 0) return;

        setIsLoading(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return setIsLoading(false);

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            canvas.width = width;
            canvas.height = height;
            
            ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
            ctx.drawImage(img, 0, 0, width, height);
            
            const imageData = ctx.getImageData(0, 0, width, height);
            if (!imageData) return setIsLoading(false);

            let textArt = '';
            const htmlArt: { char: string; color: string }[][] = [];

            for (let y = 0; y < height; y++) {
                let textRow = '';
                const htmlRow: { char: string; color: string }[] = [];
                for (let x = 0; x < width; x++) {
                    const i = (y * width + x) * 4;
                    const r = imageData.data[i];
                    const g = imageData.data[i + 1];
                    const b = imageData.data[i + 2];
                    
                    const gray = (0.21 * r + 0.72 * g + 0.07 * b) / 255;
                    const charIndex = Math.floor(gray * (activeCharset.length - 1));
                    const char = activeCharset[charIndex] || ' ';
                    
                    textRow += char;
                    htmlRow.push({ char, color: `rgb(${r},${g},${b})` });
                }
                textArt += textRow + '\n';
                htmlArt.push(htmlRow);
            }
            setAsciiArt({ text: textArt, html: htmlArt });
            setIsLoading(false);
        };
        img.src = imageSrc;
    }, [imageSrc, width, height, activeCharset, contrast, brightness]);
    
    // --- Export Functions ---
    const handleDownloadTxt = () => {
        const blob = new Blob([asciiArt.text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ascii-art.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadPng = () => {
        const art = asciiArt.html;
        if (art.length === 0 || art[0].length === 0) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const font = `${pngFontSize}px monospace`;
        ctx.font = font;
        const charWidth = ctx.measureText('M').width;
        
        canvas.width = Math.ceil(charWidth * art[0].length);
        canvas.height = pngFontSize * art.length;
        
        ctx.fillStyle = pngBgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = font; // Re-apply font after resize

        art.forEach((row, y) => {
            row.forEach((pixel, x) => {
                ctx.fillStyle = renderMode === 'html' ? pixel.color : pngTextColor;
                ctx.fillText(pixel.char, x * charWidth, (y + 1) * pngFontSize);
            });
        });

        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ascii-art.png';
        a.click();
    };


    const handleCopyHtml = () => {
        if (outputRef.current) {
            copyHtml(outputRef.current.innerHTML);
        }
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="Advanced Image to ASCII Art"
                description="Convert images to text or full-color HTML art with extensive customization options."
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">1. Upload Image</h3>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500" />
                    </Card>
                    <Card className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">2. ASCII Settings</h3>
                        <div>
                            <label className="text-sm">Resolution</label>
                            <div className="flex items-center gap-2">
                                <Input type="number" value={width} onChange={e => {setWidth(parseInt(e.target.value)); setLastChanged('width')}} aria-label="Width" />
                                <Button variant="ghost" onClick={() => setAspectRatioLocked(!aspectRatioLocked)} className="p-2 h-10 w-10 flex-shrink-0" title="Lock Aspect Ratio">
                                    {aspectRatioLocked ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a7 7 0 00-7 7c0 3.584 2.686 6.5 6 6.92V18a1 1 0 102 0v-1.08c3.314-.42 6-3.336 6-6.92a7 7 0 00-7-7zM8 9a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 4a1 1 0 100 2h2a1 1 0 100-2H9z" clipRule="evenodd" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C3.732 4.943 7.523 3 10 3s6.268 1.943 9.542 7c-3.274 5.057-7.03 7-9.542 7S3.732 15.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>}
                                </Button>
                                <Input type="number" value={height} onChange={e => {setHeight(parseInt(e.target.value)); setLastChanged('height')}} aria-label="Height" />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm">Character Set</label>
                            <Select value={charset} onChange={e => setCharset(e.target.value as CharSet)}>
                                <option value="simple">Simple</option>
                                <option value="detailed">Detailed</option>
                                <option value="blocks">Blocks</option>
                                <option value="custom">Custom</option>
                            </Select>
                        </div>
                        {charset === 'custom' && <Input value={customCharset} onChange={e => setCustomCharset(e.target.value)} />}
                        <label className="flex items-center gap-2"><input type="checkbox" checked={isReversed} onChange={e => setIsReversed(e.target.checked)} /><span>Reverse characters (dark on light)</span></label>
                    </Card>
                     <Card className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">3. Image Adjustments</h3>
                        <ControlSlider label="Contrast" value={contrast} onChange={setContrast} min={0} max={300} unit="%"/>
                        <ControlSlider label="Brightness" value={brightness} onChange={setBrightness} min={0} max={300} unit="%"/>
                     </Card>
                     <Card className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">4. Export Options</h3>
                        <div>
                            <label className="text-sm">PNG Font Size</label>
                            <Input type="number" value={pngFontSize} onChange={e => setPngFontSize(parseInt(e.target.value))} min={1} max={32} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="text-sm">PNG Background</label>
                                <Input type="color" value={pngBgColor} onChange={e => setPngBgColor(e.target.value)} className="w-full h-10 p-1" />
                            </div>
                            {renderMode === 'text' && <div>
                                <label className="text-sm">PNG Text Color</label>
                                <Input type="color" value={pngTextColor} onChange={e => setPngTextColor(e.target.value)} className="w-full h-10 p-1" />
                            </div>}
                        </div>
                     </Card>
                </div>
                <Card className="lg:col-span-2">
                     <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                        <div className="flex bg-slate-800 rounded-lg p-1">
                            <Button variant={renderMode === 'text' ? 'secondary' : 'ghost'} onClick={() => setRenderMode('text')} className="text-xs">Plain Text</Button>
                            <Button variant={renderMode === 'html' ? 'secondary' : 'ghost'} onClick={() => setRenderMode('html')} className="text-xs">HTML Color</Button>
                        </div>
                        {imageSrc && !isLoading && (
                            <div className="flex gap-2 flex-wrap">
                                <Button onClick={renderMode === 'text' ? () => copyText(asciiArt.text) : handleCopyHtml} variant="secondary">{renderMode === 'text' ? (isCopiedText ? 'Copied!' : 'Copy Text') : (isCopiedHtml ? 'Copied!' : 'Copy HTML')}</Button>
                                <Button onClick={handleDownloadTxt} variant="secondary">Download TXT</Button>
                                <Button onClick={handleDownloadPng} variant="primary">Download PNG</Button>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-900 rounded-md p-2 overflow-auto max-h-[70vh]">
                        {isLoading && <Loader text="Generating Art..." />}
                        {!imageSrc && !isLoading && <p className="text-slate-500 text-center p-8">Upload an image to start</p>}
                        {imageSrc && !isLoading && (
                            renderMode === 'text' ? (
                                <pre className="text-xs font-mono leading-tight whitespace-pre">{asciiArt.text}</pre>
                            ) : (
                                <div ref={outputRef}>{renderAsciiHtml(asciiArt.html)}</div>
                            )
                        )}
                    </div>
                </Card>
            </div>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </ToolContainer>
    );
};