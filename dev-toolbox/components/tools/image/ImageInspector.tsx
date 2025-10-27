import React, { useState, useRef } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Textarea } from '../../common/Textarea';
import { Loader } from '../../common/Loader';
import { parseExif } from '../../../services/exifService';
import { encodeMessage, decodeMessage } from '../../../services/steganographyService';

type Tab = 'metadata' | 'encode' | 'decode';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            active
                ? 'bg-slate-800 border-b-2 border-indigo-500 text-white'
                : 'bg-slate-900 border-b-2 border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
        }`}
    >
        {children}
    </button>
);

const MetadataRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 border-t border-slate-800 py-3 first:border-t-0">
        <dt className="text-sm font-medium text-slate-400 truncate">{label}</dt>
        <dd className="col-span-2 text-sm text-white break-all">{String(value)}</dd>
    </div>
);

export const ImageInspector: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('metadata');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Metadata State
    const [metadata, setMetadata] = useState<Record<string, any> | null>(null);
    const [metaImage, setMetaImage] = useState<string | null>(null);

    // Encode State
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [secretMessage, setSecretMessage] = useState('');
    const [stegoImage, setStegoImage] = useState<string | null>(null);
    const [maxMessageLength, setMaxMessageLength] = useState(0);

    // Decode State
    const [imageToDecode, setImageToDecode] = useState<string | null>(null);
    const [decodedMessage, setDecodedMessage] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, tab: Tab) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError('');
        const reader = new FileReader();

        if (tab === 'metadata') {
            setMetaImage(URL.createObjectURL(file));
            setMetadata(null);
            try {
                const buffer = await file.arrayBuffer();
                const exifData = parseExif(buffer);
                setMetadata(exifData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not parse EXIF data.');
                setMetadata({ Error: 'No valid EXIF data found.' });
            }
        } else if (tab === 'encode') {
            setStegoImage(null);
            const img = new Image();
            img.onload = () => {
                const maxLength = Math.floor((img.width * img.height * 3) / 8) - 50; // Reserve space for delimiter
                setMaxMessageLength(maxLength);
            };
            img.src = URL.createObjectURL(file);
            setCoverImage(img.src);

        } else if (tab === 'decode') {
            setDecodedMessage(null);
            setImageToDecode(URL.createObjectURL(file));
        }

        setIsLoading(false);
    };

    const handleEncode = () => {
        if (!coverImage || !secretMessage || !canvasRef.current) return;
        setIsLoading(true);
        setError('');
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
            setError('Could not get canvas context.');
            setIsLoading(false);
            return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            try {
                const newImageData = encodeMessage(ctx, secretMessage);
                ctx.putImageData(newImageData, 0, 0);
                setStegoImage(canvas.toDataURL('image/png'));
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to encode message.');
            } finally {
                setIsLoading(false);
            }
        };
        img.src = coverImage;
    };
    
    const handleDecode = () => {
        if (!imageToDecode || !canvasRef.current) return;
        setIsLoading(true);
        setError('');
        setDecodedMessage(null);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
             setError('Could not get canvas context.');
             setIsLoading(false);
             return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            try {
                const message = decodeMessage(ctx);
                setDecodedMessage(message);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to decode message.');
            } finally {
                setIsLoading(false);
            }
        };
        img.src = imageToDecode;
    };


    return (
        <ToolContainer>
            <ToolHeader
                title="Image Inspector & Steganography"
                description="View EXIF data and hide or reveal secret text messages within your images."
            />
            <canvas ref={canvasRef} className="hidden"></canvas>
            <Card>
                <div className="border-b border-slate-700 mb-4">
                    <TabButton active={activeTab === 'metadata'} onClick={() => setActiveTab('metadata')}>Metadata</TabButton>
                    <TabButton active={activeTab === 'encode'} onClick={() => setActiveTab('encode')}>Encode Message</TabButton>
                    <TabButton active={activeTab === 'decode'} onClick={() => setActiveTab('decode')}>Decode Message</TabButton>
                </div>
                {error && <p className="text-red-400 text-center mb-4">{error}</p>}
                
                {activeTab === 'metadata' && (
                    <div className="space-y-4">
                        <input type="file" accept="image/jpeg" onChange={e => handleFileChange(e, 'metadata')} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"/>
                        {isLoading ? <Loader /> : metadata && metaImage && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                                <img src={metaImage} alt="Preview" className="max-w-full h-auto rounded-md object-contain" />
                                <dl className="divide-y divide-slate-800 bg-slate-900/50 p-4 rounded-lg">
                                    {Object.entries(metadata).map(([key, value]) => <MetadataRow key={key} label={key} value={value} />)}
                                </dl>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'encode' && (
                     <div className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold">1. Upload Cover Image</label>
                            <input type="file" accept="image/png, image/jpeg" onChange={e => handleFileChange(e, 'encode')} className="mt-2 block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"/>
                        </div>
                        {coverImage && (
                            <>
                            <div>
                                <label className="text-sm font-semibold">2. Enter Secret Message</label>
                                <Textarea value={secretMessage} onChange={e => setSecretMessage(e.target.value)} rows={4} className="mt-2" placeholder="Your secret message..."/>
                                <p className="text-xs text-slate-400 mt-1">Max length for this image: ~{maxMessageLength.toLocaleString()} characters. Current: {secretMessage.length}</p>
                            </div>
                            <Button onClick={handleEncode} disabled={!secretMessage || secretMessage.length > maxMessageLength || isLoading}>
                                {isLoading ? 'Hiding Message...' : '3. Hide Message & Generate Image'}
                            </Button>
                            </>
                        )}
                        {stegoImage && (
                             <div className="text-center space-y-2">
                                <h3 className="text-lg font-bold text-white">Success! Download Your Image:</h3>
                                <img src={stegoImage} alt="Steganography Result" className="max-w-xs mx-auto rounded-md" />
                                <a href={stegoImage} download="stego-image.png"><Button>Download Image</Button></a>
                            </div>
                        )}
                    </div>
                )}
                
                {activeTab === 'decode' && (
                     <div className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold">1. Upload Image to inspect</label>
                            <input type="file" accept="image/png" onChange={e => handleFileChange(e, 'decode')} className="mt-2 block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"/>
                        </div>
                        {imageToDecode && (
                             <Button onClick={handleDecode} disabled={isLoading}>
                                {isLoading ? 'Searching...' : '2. Reveal Secret Message'}
                            </Button>
                        )}
                        {decodedMessage !== null && (
                            <div>
                                 <h3 className="text-lg font-bold text-white">Result:</h3>
                                 <Textarea readOnly value={decodedMessage || 'No hidden message found.'} rows={5} className="bg-slate-800/50 mt-2"/>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </ToolContainer>
    );
};
