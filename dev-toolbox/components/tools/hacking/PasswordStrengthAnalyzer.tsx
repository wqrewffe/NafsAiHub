import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';

const calculateEntropy = (password: string): { entropy: number, charset: number } => {
    if (!password) return { entropy: 0, charset: 0 };
    let charset = 0;
    if (/[a-z]/.test(password)) charset += 26;
    if (/[A-Z]/.test(password)) charset += 26;
    if (/[0-9]/.test(password)) charset += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charset += 32; // Common special chars
    const entropy = password.length * Math.log2(charset);
    return { entropy: Math.round(entropy), charset };
};

const timeToCrack = (entropy: number): string => {
    const guessesPerSecond = 1e9; // 1 billion guesses/sec
    const seconds = Math.pow(2, entropy) / guessesPerSecond;
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    const minutes = seconds / 60;
    if (minutes < 60) return `${Math.round(minutes)} minutes`;
    const hours = minutes / 60;
    if (hours < 24) return `${Math.round(hours)} hours`;
    const days = hours / 24;
    if (days < 365) return `${Math.round(days)} days`;
    const years = days / 365;
    if (years < 1e6) return `${Math.round(years).toLocaleString()} years`;
    return 'Millions of years';
};

const StrengthMeter: React.FC<{ entropy: number }> = ({ entropy }) => {
    const strength = entropy < 40 ? 'weak' : entropy < 80 ? 'medium' : 'strong';
    const color = strength === 'weak' ? 'bg-red-500' : strength === 'medium' ? 'bg-yellow-500' : 'bg-green-500';
    const width = Math.min((entropy / 100) * 100, 100);
    return (
        <div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className={`${color} h-2.5 rounded-full`} style={{ width: `${width}%` }}></div>
            </div>
            <p className={`text-right text-sm mt-1 font-bold ${strength === 'weak' ? 'text-red-400' : strength === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                {strength.charAt(0).toUpperCase() + strength.slice(1)}
            </p>
        </div>
    );
};

export const PasswordStrengthAnalyzer: React.FC = () => {
    const [password, setPassword] = useState('');
    const { entropy } = useMemo(() => calculateEntropy(password), [password]);

    return (
        <ToolContainer>
            <ToolHeader title="Password Strength Analyzer" description="Analyze the strength and entropy of your passwords." />
            <Card>
                <Input type="password" placeholder="Enter a password to analyze..." value={password} onChange={e => setPassword(e.target.value)} className="text-lg font-mono" />
            </Card>
            {password && (
                <Card>
                    <StrengthMeter entropy={entropy} />
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-slate-800 rounded-lg">
                            <p className="text-3xl font-bold text-white">{entropy} bits</p>
                            <p className="text-sm text-slate-400">Entropy</p>
                        </div>
                         <div className="p-4 bg-slate-800 rounded-lg">
                            <p className="text-xl font-bold text-white">{timeToCrack(entropy)}</p>
                            <p className="text-sm text-slate-400">Time to Crack (at 1B guesses/sec)</p>
                        </div>
                    </div>
                </Card>
            )}
        </ToolContainer>
    );
};
