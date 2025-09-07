
import React, { useState, useRef } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';

const SIZES = [16, 32, 48, 64, 128, 192];

export const FaviconGenerator: React.FC = () => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [favicons, setFavicons] = useState<string[]>([]);
    const originalImageRef = useRef<HTMLImageElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageSrc(event.target?.result as string);
                setFavicons([]);
            };
            reader.readAsDataURL(file);
        }
    };

    const generateFavicons = () => {
        const img = originalImageRef.current;
        if (!img) return;

        const generated: string[] = [];
        SIZES.forEach(size => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, size, size);
                generated.push(canvas.toDataURL('image/png'));
            }
        });
        setFavicons(generated);
    };
    
    const handleDownloadAll = () => {
        favicons.forEach((favicon, index) => {
            try {
                const link = document.createElement('a');
                link.href = favicon;
                link.download = `favicon-${SIZES[index]}x${SIZES[index]}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                console.error("Failed to trigger download:", error);
            }
        });
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="Favicon Generator"
                description="Upload an image to generate favicons in various standard sizes."
            />
            <Card>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <input
                        type="file"
                        accept="image/png, image/jpeg, image/svg+xml"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                    />
                    {imageSrc && <Button onClick={generateFavicons}>Generate</Button>}
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {imageSrc && (
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Original Image</h3>
                        <img ref={originalImageRef} src={imageSrc} alt="Original" className="max-w-xs h-auto rounded-md border border-slate-700" />
                    </Card>
                )}
                
                {favicons.length > 0 && (
                     <div>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                            <h3 className="text-lg font-semibold text-white">Generated Favicons</h3>
                            <Button onClick={handleDownloadAll} className="mt-2 sm:mt-0">Download All</Button>
                        </div>
                         <p className="text-xs text-slate-500 text-left sm:text-right mb-3">Your browser may ask for permission to download multiple files.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                            {favicons.map((favicon, index) => (
                                <Card key={SIZES[index]} className="text-center p-3">
                                    <img src={favicon} alt={`Favicon ${SIZES[index]}x${SIZES[index]}`} className="border border-slate-700 rounded-md bg-white/10 mx-auto" />
                                    <p className="text-sm text-slate-400 mt-2">{SIZES[index]}x{SIZES[index]}</p>
                                    <a 
                                        href={favicon} 
                                        download={`favicon-${SIZES[index]}x${SIZES[index]}.png`} 
                                        className="mt-2 inline-block bg-slate-700 hover:bg-slate-600 text-white font-semibold py-1 px-3 rounded transition-colors duration-200 text-xs w-full text-center"
                                    >
                                        Download
                                    </a>
                                </Card>
                            ))}
                        </div>
                     </div>
                )}
            </div>
        </ToolContainer>
    );
};
