import React, { useState, useEffect } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { Select } from '../../common/Select';
import { Card } from '../../common/Card';

export const TextToSpeech: React.FC = () => {
    const [text, setText] = useState('Hello, world! This is the text to speech reader.');
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<string | undefined>(undefined);
    const [rate, setRate] = useState(1);
    const [pitch, setPitch] = useState(1);
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
            if (availableVoices.length > 0 && !selectedVoice) {
                setSelectedVoice(availableVoices.find(v => v.default)?.name || availableVoices[0].name);
            }
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const handleSpeak = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) utterance.voice = voice;
        utterance.pitch = pitch;
        utterance.rate = rate;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="Text to Speech Reader"
                description="Use your browser's voice synthesis to read text aloud."
            />
            <Textarea
                placeholder="Enter text to be spoken..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
            />
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Voice</label>
                        <Select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)} disabled={voices.length === 0}>
                            {voices.map(voice => (
                                <option key={voice.name} value={voice.name}>{voice.name} ({voice.lang})</option>
                            ))}
                        </Select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Rate: {rate.toFixed(1)}</label>
                        <input type="range" min="0.1" max="2" step="0.1" value={rate} onChange={e => setRate(parseFloat(e.target.value))} className="w-full" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Pitch: {pitch.toFixed(1)}</label>
                        <input type="range" min="0" max="2" step="0.1" value={pitch} onChange={e => setPitch(parseFloat(e.target.value))} className="w-full" />
                    </div>
                </div>
            </Card>
            <Button onClick={handleSpeak} disabled={!text.trim()}>
                {isSpeaking ? 'Stop' : 'Speak'}
            </Button>
        </ToolContainer>
    );
};
