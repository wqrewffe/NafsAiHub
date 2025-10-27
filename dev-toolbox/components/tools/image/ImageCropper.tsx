import React, { useState, useRef, useEffect } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';

export const ImageCropper: React.FC = () => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 10, y: 10, width: 50, height: 50 }); // In percentage
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const imageRef = useRef<HTMLImageElement>(null);
    const croppedCanvasRef = useRef<HTMLCanvasElement>(null);
    const [croppedImage, setCroppedImage] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageSrc(URL.createObjectURL(file));
            setCroppedImage(null);
            setCrop({ x: 10, y: 10, width: 50, height: 50 });
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !imageRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();
        const dx = (e.clientX - dragStart.x) / rect.width * 100;
        const dy = (e.clientY - dragStart.y) / rect.height * 100;
        
        setCrop(c => ({
            ...c,
            x: Math.max(0, Math.min(100 - c.width, c.x + dx)),
            y: Math.max(0, Math.min(100 - c.height, c.y + dy)),
        }));
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => setIsDragging(false);

    const performCrop = () => {
        if (!imageSrc || !imageRef.current || !croppedCanvasRef.current) return;
        const img = imageRef.current;
        const canvas = croppedCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;
        
        const cropX = (crop.x / 100) * img.naturalWidth;
        const cropY = (crop.y / 100) * img.naturalHeight;
        const cropWidth = (crop.width / 100) * img.naturalWidth;
        const cropHeight = (crop.height / 100) * img.naturalHeight;

        canvas.width = cropWidth;
        canvas.height = cropHeight;

        ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        setCroppedImage(canvas.toDataURL('image/png'));
    };
    
    return (
        <ToolContainer>
            <ToolHeader title="Image Cropper" description="Visually crop your images. Drag the selection to move it." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <Card>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"/>
                    </Card>
                    {imageSrc && (
                        <Card onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                            <div className="relative select-none" onMouseMove={handleMouseMove}>
                                <img ref={imageRef} src={imageSrc} className="max-w-full opacity-50" />
                                <div className="absolute top-0 left-0 w-full h-full" style={{
                                    backgroundImage: `url(${imageSrc})`,
                                    backgroundSize: '100% 100%',
                                    clipPath: `polygon(
                                        0% 0%, 100% 0%, 100% 100%, 0% 100%,
                                        0% ${crop.y}%, 
                                        ${crop.x}% ${crop.y}%, 
                                        ${crop.x}% ${crop.y + crop.height}%, 
                                        ${crop.x + crop.width}% ${crop.y + crop.height}%, 
                                        ${crop.x + crop.width}% ${crop.y}%, 
                                        0% ${crop.y}%
                                    )`,
                                    clipRule: 'evenodd'
                                }}></div>
                                <div 
                                    className="absolute border-2 border-dashed border-white cursor-move" 
                                    style={{
                                        left: `${crop.x}%`,
                                        top: `${crop.y}%`,
                                        width: `${crop.width}%`,
                                        height: `${crop.height}%`,
                                    }}
                                    onMouseDown={handleMouseDown}
                                ></div>
                            </div>
                        </Card>
                    )}
                </div>
                <div>
                     {imageSrc && (
                        <Card className="space-y-4">
                             <Button onClick={performCrop} className="w-full">Crop Image</Button>
                             {croppedImage && (
                                 <div className="text-center">
                                     <h3 className="text-lg font-semibold text-white mb-2">Result</h3>
                                     <img src={croppedImage} className="max-w-full rounded mx-auto" />
                                     <a href={croppedImage} download="cropped-image.png">
                                         <Button className="w-full mt-4">Download Cropped Image</Button>
                                     </a>
                                 </div>
                             )}
                        </Card>
                     )}
                </div>
            </div>
            <canvas ref={croppedCanvasRef} className="hidden" />
        </ToolContainer>
    );
};