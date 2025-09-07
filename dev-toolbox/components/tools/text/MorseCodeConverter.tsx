import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

const MORSE_CODE_MAP: { [key: string]: string } = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
    'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
    'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..',
    '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
    ' ': '/', '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.'
};
const REVERSE_MORSE_CODE_MAP: { [key: string]: string } = Object.fromEntries(Object.entries(MORSE_CODE_MAP).map(([k, v]) => [v, k]));

const textToMorse = (text: string): string => {
    return text.toUpperCase().split('').map(char => MORSE_CODE_MAP[char] || '').join(' ');
};

const morseToText = (morse: string): string => {
    return morse.split(' ').map(code => REVERSE_MORSE_CODE_MAP[code] || '').join('');
};

export const MorseCodeConverter: React.FC = () => {
    const [input, setInput] = useState('Hello World');
    const [output, setOutput] = useState('');
    const [isCopied, copy] = useCopyToClipboard();

    const handleEncode = () => setOutput(textToMorse(input));
    const handleDecode = () => setOutput(morseToText(input));

    return (
        <ToolContainer>
            <ToolHeader title="Morse Code Converter" description="Translate text to and from Morse code." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                    placeholder="Enter text or Morse code..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={10}
                />
                <div className="relative">
                    <Textarea
                        placeholder="Result..."
                        value={output}
                        readOnly
                        rows={10}
                        className="bg-slate-800/50"
                    />
                    {output && <Button onClick={() => copy(output)} className="absolute top-2 right-2 px-3 py-1 text-xs" variant="secondary">{isCopied ? 'Copied!' : 'Copy'}</Button>}
                </div>
            </div>
             <div className="flex flex-wrap gap-2">
                <Button onClick={handleEncode}>Text to Morse</Button>
                <Button onClick={handleDecode}>Morse to Text</Button>
                <Button onClick={() => { setInput(''); setOutput(''); }} variant="secondary">Clear</Button>
            </div>
        </ToolContainer>
    );
};