import React, { useState, useEffect } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { useToolTelemetry } from '../../common/useToolTelemetry';

const CHARSETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

export const PasswordGenerator: React.FC = () => {
    const [password, setPassword] = useState('');
    const [length, setLength] = useState(16);
    const [options, setOptions] = useState({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: false,
    });
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    const generatePassword = () => {
        const selectedCharsets = Object.entries(options)
            .filter(([, isEnabled]) => isEnabled)
            .map(([key]) => CHARSETS[key])
            .join('');

        if (!selectedCharsets) {
            setPassword('');
            return;
        }

        let newPassword = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * selectedCharsets.length);
            newPassword += selectedCharsets[randomIndex];
        }
    setPassword(newPassword);
    try { recordUsage(`${length}`, newPassword); } catch (e) { }
    };

    useEffect(() => {
        generatePassword();
    }, [length, options]);

    const recordUsage = useToolTelemetry('password-generator', 'Password Generator', 'Developer');
    
    const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOptions({ ...options, [e.target.name]: e.target.checked });
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="Password Generator"
                description="Create strong, secure, and random passwords."
            />
            <Card>
                <div className="relative flex items-center">
                    <Input 
                        type="text"
                        value={password}
                        readOnly
                        className="font-mono text-lg pr-24"
                        placeholder="Your generated password..."
                    />
                    <Button onClick={() => copyToClipboard(password)} className="absolute right-2">{isCopied ? 'Copied!' : 'Copy'}</Button>
                </div>
            </Card>

            <Card className="space-y-4">
                <div>
                    <label className="flex items-center justify-between">
                        <span>Password Length:</span>
                        <span className="font-bold text-white">{length}</span>
                    </label>
                    <input
                        type="range"
                        min="8"
                        max="64"
                        value={length}
                        onChange={(e) => setLength(parseInt(e.target.value))}
                        className="w-full mt-2"
                    />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.keys(CHARSETS).map(key => (
                        <label key={key} className="flex items-center space-x-2 bg-slate-700 p-3 rounded-md">
                            <input
                                type="checkbox"
                                name={key}
                                checked={options[key]}
                                onChange={handleOptionChange}
                                className="h-4 w-4 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="capitalize">{key}</span>
                        </label>
                    ))}
                </div>
                 <Button onClick={generatePassword} className="w-full">Regenerate</Button>
            </Card>
        </ToolContainer>
    );
};
