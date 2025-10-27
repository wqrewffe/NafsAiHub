
import React, { useState, useEffect, useRef } from 'react';
import QRCodeStyling, { Options as QRCodeStylingOptions } from 'qr-code-styling';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Select } from '../../common/Select';
import { Input } from '../../common/Input';

const ControlWrapper: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={className}>
        <h4 className="text-md font-semibold text-white mb-3">{title}</h4>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            active
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-slate-900 border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
        } border-b-2`}
    >
        {children}
    </button>
);


export const QrCodeGenerator: React.FC = () => {
    // State Management
    const [activeTab, setActiveTab] = useState('content');
    
    // Content State
    const [text, setText] = useState('https://aistudio.google.com/app');

    // Styling State
    const [dotStyle, setDotStyle] = useState<QRCodeStylingOptions['dotsOptions']['type']>('rounded');
    const [cornerStyle, setCornerStyle] = useState<QRCodeStylingOptions['cornersSquareOptions']['type']>('extra-rounded');
    const [cornerDotStyle, setCornerDotStyle] = useState<QRCodeStylingOptions['cornersDotOptions']['type']>('dot');
    const [qrMargin, setQrMargin] = useState(10);
    
    // Color State
    const [dotColorType, setDotColorType] = useState('single');
    const [dotColor1, setDotColor1] = useState('#4f46e5');
    const [dotColor2, setDotColor2] = useState('#a855f7');
    const [dotGradientType, setDotGradientType] = useState<'linear' | 'radial'>('linear');
    const [dotGradientRotation, setDotGradientRotation] = useState(0);

    const [cornerColorType, setCornerColorType] = useState('single');
    const [cornerColor1, setCornerColor1] = useState('#000000');
    const [cornerColor2, setCornerColor2] = useState('#4338ca');
    const [cornerGradientType, setCornerGradientType] = useState<'linear' | 'radial'>('linear');
    const [cornerGradientRotation, setCornerGradientRotation] = useState(0);
    
    const [cornerDotColor, setCornerDotColor] = useState('#000000');

    const [backgroundColorType, setBackgroundColorType] = useState('single');
    const [backgroundColor1, setBackgroundColor1] = useState('#ffffff');
    const [backgroundColor2, setBackgroundColor2] = useState('#e0e0e0');
    const [backgroundGradientType, setBackgroundGradientType] = useState<'linear' | 'radial'>('linear');
    const [backgroundGradientRotation, setBackgroundGradientRotation] = useState(0);

    // Logo State
    const [image, setImage] = useState<string | null>(null);
    const [imageSize, setImageSize] = useState(0.4);
    const [imageMargin, setImageMargin] = useState(4);
    const [hideBackgroundDots, setHideBackgroundDots] = useState(true);
    
    // Download State
    const [downloadExtension, setDownloadExtension] = useState('png');

    // Refs
    const ref = useRef<HTMLDivElement>(null);
    const qrCodeInstanceRef = useRef<QRCodeStyling | null>(null);
    
    // Initialize QR Code instance
    useEffect(() => {
        if (ref.current) {
            qrCodeInstanceRef.current = new QRCodeStyling({
                width: 300,
                height: 300,
                type: 'svg',
                data: text,
                margin: qrMargin,
            });
            qrCodeInstanceRef.current.append(ref.current);
        }
    }, []);

    // Update QR Code on state change
    useEffect(() => {
        if (qrCodeInstanceRef.current) {
            const qrOptions: QRCodeStylingOptions = {
                data: text,
                margin: qrMargin,
                dotsOptions: {
                    type: dotStyle,
                    ...(dotColorType === 'single'
                        ? { color: dotColor1 }
                        : {
                            gradient: {
                                type: dotGradientType,
                                rotation: dotGradientRotation,
                                colorStops: [{ offset: 0, color: dotColor1 }, { offset: 1, color: dotColor2 }],
                            },
                        }),
                },
                backgroundOptions: {
                    ...(backgroundColorType === 'single'
                        ? { color: backgroundColor1 }
                        : {
                            gradient: {
                                type: backgroundGradientType,
                                rotation: backgroundGradientRotation,
                                colorStops: [{ offset: 0, color: backgroundColor1 }, { offset: 1, color: backgroundColor2 }],
                            },
                        }),
                },
                cornersSquareOptions: {
                    type: cornerStyle,
                    ...(cornerColorType === 'single'
                        ? { color: cornerColor1 }
                        : {
                            gradient: {
                                type: cornerGradientType,
                                rotation: cornerGradientRotation,
                                colorStops: [{ offset: 0, color: cornerColor1 }, { offset: 1, color: cornerColor2 }],
                            },
                        }),
                },
                cornersDotOptions: { 
                    type: cornerDotStyle,
                    color: cornerDotColor 
                },
                image: image || undefined,
                imageOptions: {
                    imageSize: imageSize,
                    margin: imageMargin,
                    hideBackgroundDots: hideBackgroundDots,
                    crossOrigin: 'anonymous', // Necessary for downloading with image
                },
            };
            qrCodeInstanceRef.current.update(qrOptions);
        }
    }, [
        text, qrMargin, dotStyle, cornerStyle, cornerDotStyle, 
        dotColorType, dotColor1, dotColor2, dotGradientType, dotGradientRotation,
        cornerColorType, cornerColor1, cornerColor2, cornerGradientType, cornerGradientRotation,
        cornerDotColor,
        backgroundColorType, backgroundColor1, backgroundColor2, backgroundGradientType, backgroundGradientRotation,
        image, imageSize, imageMargin, hideBackgroundDots
    ]);

    const handleDownload = () => {
        qrCodeInstanceRef.current?.download({ name: 'qrcode', extension: downloadExtension as any });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    const removeImage = () => {
        setImage(null);
        const fileInput = document.getElementById('qr-image-upload') as HTMLInputElement;
        if(fileInput) fileInput.value = '';
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="Advanced QR Code Generator"
                description="Create and customize stylish QR codes with colors, shapes, and logos."
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <div className="border-b border-slate-800 mb-4 flex space-x-1 flex-wrap">
                        <TabButton active={activeTab === 'content'} onClick={() => setActiveTab('content')}>Content</TabButton>
                        <TabButton active={activeTab === 'styling'} onClick={() => setActiveTab('styling')}>Styling</TabButton>
                        <TabButton active={activeTab === 'colors'} onClick={() => setActiveTab('colors')}>Colors</TabButton>
                        <TabButton active={activeTab === 'logo'} onClick={() => setActiveTab('logo')}>Logo</TabButton>
                    </div>

                    <div className="space-y-6">
                        {activeTab === 'content' && (
                           <ControlWrapper title="Content">
                                <Textarea
                                    placeholder="Enter URL or text..."
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    rows={4}
                                />
                            </ControlWrapper>
                        )}

                        {activeTab === 'styling' && (
                          <>
                            <ControlWrapper title="Dots">
                                <Select value={dotStyle} onChange={e => setDotStyle(e.target.value as any)}>
                                    <option value="square">Square</option>
                                    <option value="dots">Dots</option>
                                    <option value="rounded">Rounded</option>
                                    <option value="extra-rounded">Extra Rounded</option>
                                    <option value="classy">Classy</option>
                                    <option value="classy-rounded">Classy Rounded</option>
                                </Select>
                            </ControlWrapper>
                             <ControlWrapper title="Corners Square">
                                <Select value={cornerStyle} onChange={e => setCornerStyle(e.target.value as any)}>
                                    <option value="square">Square</option>
                                    <option value="dot">Dot</option>
                                    <option value="extra-rounded">Extra Rounded</option>
                                </Select>
                            </ControlWrapper>
                             <ControlWrapper title="Corners Dot">
                                <Select value={cornerDotStyle} onChange={e => setCornerDotStyle(e.target.value as any)}>
                                    <option value="square">Square</option>
                                    <option value="dot">Dot</option>
                                </Select>
                            </ControlWrapper>
                             <ControlWrapper title="Margin">
                                <div>
                                    <label className="text-sm">QR Code Margin: {qrMargin}px</label>
                                    <input type="range" min="0" max="40" step="1" value={qrMargin} onChange={e => setQrMargin(parseInt(e.target.value))} className="w-full"/>
                                </div>
                            </ControlWrapper>
                          </>
                        )}
                        
                        {activeTab === 'colors' && (
                          <>
                            <ControlWrapper title="Dots Color">
                               <Select value={dotColorType} onChange={e => setDotColorType(e.target.value)}>
                                   <option value="single">Single Color</option>
                                   <option value="gradient">Gradient</option>
                               </Select>
                               <div className="flex gap-2">
                                    <Input type="color" value={dotColor1} onChange={e => setDotColor1(e.target.value)} className="p-1 h-10 w-full"/>
                                    {dotColorType === 'gradient' && <Input type="color" value={dotColor2} onChange={e => setDotColor2(e.target.value)} className="p-1 h-10 w-full"/>}
                               </div>
                                {dotColorType === 'gradient' && <>
                                    <Select value={dotGradientType} onChange={e => setDotGradientType(e.target.value as any)}>
                                        <option value="linear">Linear</option>
                                        <option value="radial">Radial</option>
                                    </Select>
                                    <label className="text-sm">Rotation: {dotGradientRotation}°</label>
                                    <input type="range" min="0" max="360" value={dotGradientRotation} onChange={e => setDotGradientRotation(parseInt(e.target.value))} className="w-full"/>
                                </>}
                            </ControlWrapper>
                             <ControlWrapper title="Corners Square Color">
                               <Select value={cornerColorType} onChange={e => setCornerColorType(e.target.value)}>
                                   <option value="single">Single Color</option>
                                   <option value="gradient">Gradient</option>
                               </Select>
                               <div className="flex gap-2">
                                    <Input type="color" value={cornerColor1} onChange={e => setCornerColor1(e.target.value)} className="p-1 h-10 w-full"/>
                                    {cornerColorType === 'gradient' && <Input type="color" value={cornerColor2} onChange={e => setCornerColor2(e.target.value)} className="p-1 h-10 w-full"/>}
                               </div>
                                {cornerColorType === 'gradient' && <>
                                    <Select value={cornerGradientType} onChange={e => setCornerGradientType(e.target.value as any)}>
                                        <option value="linear">Linear</option>
                                        <option value="radial">Radial</option>
                                    </Select>
                                     <label className="text-sm">Rotation: {cornerGradientRotation}°</label>
                                    <input type="range" min="0" max="360" value={cornerGradientRotation} onChange={e => setCornerGradientRotation(parseInt(e.target.value))} className="w-full"/>
                                </>}
                            </ControlWrapper>
                             <ControlWrapper title="Corners Dot Color">
                                 <Input type="color" value={cornerDotColor} onChange={e => setCornerDotColor(e.target.value)} className="p-1 h-10 w-full"/>
                            </ControlWrapper>
                            <ControlWrapper title="Background Color">
                               <Select value={backgroundColorType} onChange={e => setBackgroundColorType(e.target.value)}>
                                   <option value="single">Single Color</option>
                                   <option value="gradient">Gradient</option>
                               </Select>
                               <div className="flex gap-2">
                                    <Input type="color" value={backgroundColor1} onChange={e => setBackgroundColor1(e.target.value)} className="p-1 h-10 w-full"/>
                                    {backgroundColorType === 'gradient' && <Input type="color" value={backgroundColor2} onChange={e => setBackgroundColor2(e.target.value)} className="p-1 h-10 w-full"/>}
                               </div>
                                {backgroundColorType === 'gradient' && <>
                                    <Select value={backgroundGradientType} onChange={e => setBackgroundGradientType(e.target.value as any)}>
                                        <option value="linear">Linear</option>
                                        <option value="radial">Radial</option>
                                    </Select>
                                     <label className="text-sm">Rotation: {backgroundGradientRotation}°</label>
                                    <input type="range" min="0" max="360" value={backgroundGradientRotation} onChange={e => setBackgroundGradientRotation(parseInt(e.target.value))} className="w-full"/>
                                </>}
                            </ControlWrapper>
                          </>
                        )}

                        {activeTab === 'logo' && (
                            <ControlWrapper title="Logo Image">
                                <input
                                    id="qr-image-upload"
                                    type="file"
                                    accept="image/png, image/jpeg, image/gif, image/svg+xml"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                                />
                                {image && (
                                    <div className="mt-4 space-y-4">
                                        <Button onClick={removeImage} variant="secondary" className="w-full">Remove Image</Button>
                                        <div>
                                            <label className="text-sm">Logo Size: {Math.round(imageSize * 100)}%</label>
                                            <input type="range" min="0.1" max="0.7" step="0.05" value={imageSize} onChange={e => setImageSize(parseFloat(e.target.value))} className="w-full"/>
                                        </div>
                                        <div>
                                            <label className="text-sm">Margin: {imageMargin}px</label>
                                            <input type="range" min="0" max="20" step="1" value={imageMargin} onChange={e => setImageMargin(parseInt(e.target.value))} className="w-full"/>
                                        </div>
                                        <label className="flex items-center space-x-2">
                                            <input type="checkbox" checked={hideBackgroundDots} onChange={e => setHideBackgroundDots(e.target.checked)} className="h-4 w-4 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500"/>
                                            <span>Hide dots behind logo</span>
                                        </label>
                                    </div>
                                )}
                            </ControlWrapper>
                        )}
                    </div>
                </Card>

                <Card className="lg:col-span-2 flex flex-col items-center justify-center space-y-6">
                    <div ref={ref} className="border-4 border-slate-700 p-2 rounded-lg" />
                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                        <Select value={downloadExtension} onChange={e => setDownloadExtension(e.target.value)} className="flex-grow">
                            <option value="png">PNG</option>
                            <option value="jpeg">JPEG</option>
                            <option value="svg">SVG</option>
                        </Select>
                        <Button onClick={handleDownload} className="w-full sm:w-auto flex-grow">
                            Download QR Code
                        </Button>
                    </div>
                </Card>
            </div>
        </ToolContainer>
    );
};
