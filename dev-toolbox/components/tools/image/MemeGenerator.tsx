import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Select } from '../../common/Select';
import { Loader } from '../../common/Loader';
import { generateMemeCaption, generateMultiPanelMemeCaptions } from '../../../services/geminiService';
import { useToolTelemetry } from '../../common/useToolTelemetry';

type Layout = 'single' | '2x1' | '2x2';
type TextStyles = {
    font: string;
    fillColor: string;
    strokeColor: string;
    fontSize: number;
};
type MemeText = {
    top: string;
    bottom: string;
};
type ImageInfo = {
    src: string;
    file: File;
}

const dataUrlToBase64 = (dataUrl: string) => dataUrl.split(',')[1];

export const MemeGenerator: React.FC = () => {
    const [images, setImages] = useState<(ImageInfo | null)[]>([]);
    const [texts, setTexts] = useState<MemeText[]>([]);
    const [styles, setStyles] = useState<TextStyles>({
        font: 'Impact',
        fillColor: '#FFFFFF',
        strokeColor: '#000000',
        fontSize: 10,
    });
    const [layout, setLayout] = useState<Layout>('single');
    const [activePanel, setActivePanel] = useState(0);
    const [memeUrl, setMemeUrl] = useState<string | null>(null);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const maxPanels = { single: 1, '2x1': 2, '2x2': 4 }[layout];
    const allPanelsFilled = layout !== 'single' && images.slice(0, maxPanels).every(img => img !== null);

    const resetStateForLayout = useCallback((newLayout: Layout) => {
        const newMaxPanels = { single: 1, '2x1': 2, '2x2': 4 }[newLayout];
        setLayout(newLayout);
        setImages(new Array(newMaxPanels).fill(null));
        setTexts(new Array(newMaxPanels).fill(null).map(() => ({ top: 'TOP', bottom: 'BOTTOM' })));
        setActivePanel(0);
        setMemeUrl(null);
    }, []);

    useEffect(() => {
        resetStateForLayout('single');
    }, [resetStateForLayout]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files as FileList | null;
        if (!files || files.length === 0) return;
        
        const filesToProcess = Array.from(files).slice(0, maxPanels) as File[];
        const newImages: (ImageInfo | null)[] = new Array(maxPanels).fill(null);

        filesToProcess.forEach((file: File, index: number) => {
            newImages[index] = { src: URL.createObjectURL(file as Blob), file };
        });

        setImages(newImages);
    };

    const fileToDataUrl = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const recordUsage = useToolTelemetry('ai-meme-generator', 'Advanced AI Meme Generator', 'AI');

    const handleGenerateAICaption = async () => {
        const activeImage = images[activePanel];
        if (!activeImage) return;

        setIsGeneratingAI(true);
        try {
            const base64 = dataUrlToBase64(await fileToDataUrl(activeImage.file));
            const caption = await generateMemeCaption(base64, activeImage.file.type);
            setTexts(current => current.map((text, i) => i === activePanel ? { top: caption.topText.toUpperCase(), bottom: caption.bottomText.toUpperCase() } : text));
            try { await recordUsage(`image-panel-${activePanel}`, caption); } catch (e) { }
        } catch (error) {
            console.error("AI Caption generation failed:", error);
            alert("Could not generate AI caption. Please try again.");
        } finally {
            setIsGeneratingAI(false);
        }
    };
    
    const handleGenerateThemedCaptions = async () => {
        const requiredImages = images.slice(0, maxPanels);
        if (requiredImages.some(img => !img)) {
            alert("Please upload an image for all panels before generating themed captions.");
            return;
        }
        
        setIsGeneratingAI(true);
        try {
            const imagePromises = requiredImages.map(imgInfo => 
                fileToDataUrl(imgInfo!.file)
            );
            const imageDataUrls = await Promise.all(imagePromises);
            
            const imagePayloads = imageDataUrls.map((dataUrl, index) => ({
                base64ImageData: dataUrlToBase64(dataUrl),
                mimeType: requiredImages[index]!.file.type,
            }));
            
            const captions = await generateMultiPanelMemeCaptions(imagePayloads);
    
            if (captions.length === maxPanels) {
                const newTexts = new Array(4).fill(null).map((_, i) => {
                    if (i < maxPanels) {
                        return {
                            top: captions[i].topText.toUpperCase(),
                            bottom: captions[i].bottomText.toUpperCase(),
                        };
                    }
                    return { top: 'TOP', bottom: 'BOTTOM' };
                });
                setTexts(newTexts);
                try { await recordUsage('multi-panel', captions); } catch (e) { }
            } else {
                throw new Error("AI returned an incorrect number of captions for the layout.");
            }
    
        } catch (error) {
            console.error("AI Themed Caption generation failed:", error);
            alert("Could not generate themed captions. Please try again.");
        } finally {
            setIsGeneratingAI(false);
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const allImagesLoaded = Promise.all(
            images.map(imgInfo => {
                if (!imgInfo) return Promise.resolve(null);
                return new Promise<HTMLImageElement>(resolve => {
                    const img = new Image();
                    img.src = imgInfo.src;
                    img.onload = () => resolve(img);
                    img.onerror = () => resolve(null); // Resolve null on error
                });
            })
        );

        allImagesLoaded.then(loadedImages => {
            const firstValidImage = loadedImages.find(img => img !== null);
            const canvasWidth = firstValidImage?.width ?? 600;
            const canvasHeight = firstValidImage?.height ?? 500;
            
            canvas.width = (layout === '2x1' && firstValidImage) ? firstValidImage.width * 2 : canvasWidth;
            canvas.height = (layout === '2x2' && firstValidImage) ? firstValidImage.height * 2 : canvasHeight;


            ctx.clearRect(0,0, canvas.width, canvas.height);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0,0, canvas.width, canvas.height);

            const panelGeometries = {
                single: [{ x: 0, y: 0, w: canvas.width, h: canvas.height }],
                '2x1': [
                    { x: 0, y: 0, w: canvas.width / 2, h: canvas.height },
                    { x: canvas.width / 2, y: 0, w: canvas.width / 2, h: canvas.height },
                ],
                '2x2': [
                    { x: 0, y: 0, w: canvas.width / 2, h: canvas.height / 2 },
                    { x: canvas.width / 2, y: 0, w: canvas.width / 2, h: canvas.height / 2 },
                    { x: 0, y: canvas.height / 2, w: canvas.width / 2, h: canvas.height / 2 },
                    { x: canvas.width / 2, y: canvas.height / 2, w: canvas.width / 2, h: canvas.height / 2 },
                ]
            }[layout];
            
            loadedImages.forEach((img, i) => {
                const geo = panelGeometries[i];
                if (!img || !geo) return;
                
                const hRatio = geo.w / img.width;
                const vRatio = geo.h / img.height;
                const ratio = Math.min(hRatio, vRatio);
                const centerShift_x = (geo.w - img.width * ratio) / 2;
                const centerShift_y = (geo.h - img.height * ratio) / 2;
                ctx.drawImage(img, 0, 0, img.width, img.height, geo.x + centerShift_x, geo.y + centerShift_y, img.width * ratio, img.height * ratio);
                
                const fontSize = geo.w / styles.fontSize;
                ctx.font = `${fontSize}px ${styles.font}`;
                ctx.fillStyle = styles.fillColor;
                ctx.strokeStyle = styles.strokeColor;
                ctx.lineWidth = fontSize / 20;
                ctx.textAlign = 'center';

                const text = texts[i];
                if (!text) return;
                const textX = geo.x + geo.w / 2;
                
                ctx.textBaseline = 'top';
                ctx.strokeText(text.top, textX, geo.y + 10);
                ctx.fillText(text.top, textX, geo.y + 10);
                
                ctx.textBaseline = 'bottom';
                ctx.strokeText(text.bottom, textX, geo.y + geo.h - 10);
                ctx.fillText(text.bottom, textX, geo.y + geo.h - 10);
            });
            
            setMemeUrl(canvas.toDataURL('image/png'));
        });

    }, [images, texts, styles, layout, maxPanels]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Advanced AI Meme Generator"
                description="Create multi-panel memes with AI-powered caption suggestions and advanced styling."
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">1. Layout &amp; Image</h3>
                        <Select value={layout} onChange={e => resetStateForLayout(e.target.value as Layout)}>
                            <option value="single">Single Image</option>
                            <option value="2x1">2x1 Grid</option>
                            <option value="2x2">2x2 Grid</option>
                        </Select>
                        <input
                            type="file"
                            accept="image/*"
                            multiple={layout !== 'single'}
                            onChange={handleFileChange}
                            className="mt-2 block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                        />
                    </Card>

                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">2. Text &amp; AI</h3>
                        {layout !== 'single' && (
                            <div className="flex gap-1 mb-2">
                                {Array(maxPanels).fill(0).map((_, i) => (
                                    <Button key={i} variant={activePanel === i ? 'primary' : 'secondary'} onClick={() => setActivePanel(i)} className="text-xs flex-1">Image {i+1}</Button>
                                ))}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Input placeholder="Top Text" value={texts[activePanel]?.top || ''} onChange={e => setTexts(c => c.map((t, i) => i === activePanel ? {...t, top: e.target.value.toUpperCase()} : t))} />
                            <Input placeholder="Bottom Text" value={texts[activePanel]?.bottom || ''} onChange={e => setTexts(c => c.map((t, i) => i === activePanel ? {...t, bottom: e.target.value.toUpperCase()} : t))} />
                        </div>
                         <div className="flex flex-col sm:flex-row gap-2 mt-3">
                            <Button
                                onClick={handleGenerateAICaption}
                                disabled={!images[activePanel] || isGeneratingAI}
                                className="w-full flex-1"
                                title="Generate a caption only for the selected image panel"
                            >
                                {isGeneratingAI ? <Loader text="" /> : (
                                    <div className="flex items-center justify-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.375 3.375 0 0014 18.442V19.5a3.375 3.375 0 00-4 0v-.058a3.375 3.375 0 00-.843-.995l-.548-.547z" /></svg>
                                        <span>AI for Panel</span>
                                    </div>
                                )}
                            </Button>
                            {layout !== 'single' && (
                                <Button
                                    onClick={handleGenerateThemedCaptions}
                                    disabled={!allPanelsFilled || isGeneratingAI}
                                    className="w-full flex-1"
                                    title="Generate connected captions for all image panels at once"
                                >
                                    {isGeneratingAI ? <Loader text="" /> : (
                                        <div className="flex items-center justify-center gap-2">
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                                            <span>Themed AI for All</span>
                                        </div>
                                    )}
                                </Button>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">3. Styling</h3>
                        <div className="space-y-3">
                             <div>
                                <label className="text-sm">Font Family</label>
                                <Select value={styles.font} onChange={e => setStyles(s => ({...s, font: e.target.value}))}>
                                    <option>Impact</option><option>Arial</option><option>Comic Sans MS</option>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-sm">Text</label><Input type="color" value={styles.fillColor} onChange={e => setStyles(s => ({...s, fillColor: e.target.value}))} className="h-10 p-1 w-full"/></div>
                                <div><label className="text-sm">Outline</label><Input type="color" value={styles.strokeColor} onChange={e => setStyles(s => ({...s, strokeColor: e.target.value}))} className="h-10 p-1 w-full"/></div>
                            </div>
                             <div>
                                <label className="text-sm">Font Size: {styles.fontSize}</label>
                                <input type="range" min="5" max="20" value={styles.fontSize} onChange={e => setStyles(s => ({...s, fontSize: parseInt(e.target.value)}))} className="w-full"/>
                             </div>
                        </div>
                    </Card>

                    {memeUrl && (
                        <a href={memeUrl} download="ai-meme.png">
                            <Button className="w-full">4. Download Meme</Button>
                        </a>
                    )}
                </div>
                <Card className="lg:col-span-2 flex items-center justify-center p-4 bg-slate-950">
                    {memeUrl ? (
                         <img src={memeUrl} alt="Meme preview" className="max-w-full max-h-[70vh] rounded-md" />
                    ) : (
                        <p className="text-slate-500">Upload an image to start</p>
                    )}
                    <canvas ref={canvasRef} className="hidden"></canvas>
                </Card>
            </div>
        </ToolContainer>
    );
};