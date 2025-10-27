import React, { useState, useRef } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';

export const ImageFlipper: React.FC = () => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [fileName, setFileName] = useState('flipped.png');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (event) => {
                const src = event.target?.result as string;
                setImageSrc(src);
                drawImage(src, 0, false, false);
            };
            reader.readAsDataURL(file);
        }
    };

    const drawImage = (src: string, rotation: number, flipH: boolean, flipV: boolean) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const img = new Image();
        img.onload = () => {
            const w = img.width;
            const h = img.height;
            canvas.width = (rotation % 180 === 0) ? w : h;
            canvas.height = (rotation % 180 === 0) ? h : w;

            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
            ctx.drawImage(img, -w / 2, -h / 2);
            ctx.restore();
            
            setImageSrc(canvas.toDataURL('image/png'));
        };
        img.src = src;
    };

    const handleAction = (action: 'flipH' | 'flipV' | 'rotateCW' | 'rotateCCW') => {
        if (!imageSrc) return;
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d')!;
            
            switch(action) {
                case 'flipH':
                    tempCanvas.width = canvas.width;
                    tempCanvas.height = canvas.height;
                    tempCtx.translate(canvas.width, 0);
                    tempCtx.scale(-1, 1);
                    tempCtx.drawImage(canvas, 0, 0);
                    break;
                case 'flipV':
                    tempCanvas.width = canvas.width;
                    tempCanvas.height = canvas.height;
                    tempCtx.translate(0, canvas.height);
                    tempCtx.scale(1, -1);
                    tempCtx.drawImage(canvas, 0, 0);
                    break;
                case 'rotateCW':
                    tempCanvas.width = canvas.height;
                    tempCanvas.height = canvas.width;
                    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
                    tempCtx.rotate(90 * Math.PI / 180);
                    tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
                    break;
                case 'rotateCCW':
                    tempCanvas.width = canvas.height;
                    tempCanvas.height = canvas.width;
                    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
                    tempCtx.rotate(-90 * Math.PI / 180);
                    tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
                    break;
            }
            setImageSrc(tempCanvas.toDataURL('image/png'));
        }
        img.src = imageSrc;
    };


    return (
        <ToolContainer>
            <ToolHeader
                title="Image Flipper & Rotator"
                description="Quickly flip your images horizontally, vertically, or rotate them by 90 degrees."
            />
            <Card>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                />
            </Card>

            {imageSrc && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="flex items-center justify-center p-4">
                         <img src={imageSrc} alt="Preview" className="max-w-full max-h-[400px] rounded-md" />
                    </Card>
                    <div className="space-y-4">
                        <Card>
                            <h3 className="text-lg font-semibold text-white mb-3">Actions</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <Button onClick={() => handleAction('flipH')}>Flip Horizontal</Button>
                                <Button onClick={() => handleAction('flipV')}>Flip Vertical</Button>
                                <Button onClick={() => handleAction('rotateCW')}>Rotate 90° CW</Button>
                                <Button onClick={() => handleAction('rotateCCW')}>Rotate 90° CCW</Button>
                            </div>
                        </Card>
                        <Card>
                            <a href={imageSrc} download={`edited-${fileName}`}>
                                <Button className="w-full">Download Image</Button>
                            </a>
                        </Card>
                    </div>
                </div>
            )}
        </ToolContainer>
    );
};
