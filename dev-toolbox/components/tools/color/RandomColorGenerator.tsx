
import React, { useState, useEffect } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

interface Color {
    hex: string;
    locked: boolean;
}

const generateRandomHex = (): string => {
    return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`.toUpperCase();
};

const ColorColumn: React.FC<{ color: Color; onLock: () => void; onCopy: (hex: string) => void; isCopied: boolean }> = ({ color, onLock, onCopy, isCopied }) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-end p-4 text-white" style={{ backgroundColor: color.hex }}>
            <div className="flex items-center gap-2 bg-black/30 p-2 rounded-lg">
                <span className="font-mono text-lg">{color.hex}</span>
                <button onClick={onLock} title="Lock color">
                    {color.locked ? 
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a7 7 0 00-7 7c0 3.584 2.686 6.5 6 6.92V18a1 1 0 102 0v-1.08c3.314-.42 6-3.336 6-6.92a7 7 0 00-7-7zM8 9a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 4a1 1 0 100 2h2a1 1 0 100-2H9z" clipRule="evenodd" /></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-70" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C3.732 4.943 7.523 3 10 3s6.268 1.943 9.542 7c-3.274 5.057-7.03 7-9.542 7S3.732 15.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>}
                </button>
                <button onClick={() => onCopy(color.hex)} title="Copy color">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
            </div>
            {isCopied && <span className="text-xs mt-2 bg-black/50 px-2 py-1 rounded">Copied!</span>}
        </div>
    );
};


export const RandomColorGenerator: React.FC = () => {
    const [palette, setPalette] = useState<Color[]>([]);
    const [copiedHex, setCopiedHex] = useState('');
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    const generatePalette = () => {
        setPalette(prev => {
            if (prev.length === 0) { // Initial generation
                return Array(5).fill(null).map(() => ({ hex: generateRandomHex(), locked: false }));
            }
            return prev.map(color => color.locked ? color : { ...color, hex: generateRandomHex() });
        });
    };

    useEffect(() => {
        generatePalette();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
                e.preventDefault();
                generatePalette();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    
    const handleLock = (index: number) => {
        setPalette(prev => prev.map((c, i) => i === index ? { ...c, locked: !c.locked } : c));
    };
    
    const handleCopy = (hex: string) => {
        copyToClipboard(hex);
        setCopiedHex(hex);
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="Random Color Palette Generator"
                description="Generate beautiful color schemes. Press spacebar to generate, click to lock."
            />
            <div className="flex h-[60vh] rounded-xl overflow-hidden border border-slate-800">
                {palette.map((color, i) => (
                    <ColorColumn 
                        key={i} 
                        color={color} 
                        onLock={() => handleLock(i)}
                        onCopy={handleCopy}
                        isCopied={isCopied && copiedHex === color.hex}
                    />
                ))}
            </div>
             <Button onClick={generatePalette} className="w-full">Generate Palette (or press Spacebar)</Button>
        </ToolContainer>
    );
};
