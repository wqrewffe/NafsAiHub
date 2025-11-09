
import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';

const commonPxValues = [10, 12, 14, 16, 18, 20, 24, 30, 32, 36, 48, 60, 72];

export const PxToRemConverter: React.FC = () => {
    const [baseSize, setBaseSize] = useState(16);
    const [pxValue, setPxValue] = useState('16');
    const [remValue, setRemValue] = useState('1');

    const handleBaseChange = (value: number) => {
        if(value > 0) {
            setBaseSize(value);
            const px = parseFloat(remValue) * value;
            setPxValue(String(px));
        }
    };
    
    const handlePxChange = (value: string) => {
        setPxValue(value);
        const pxNum = parseFloat(value);
        if (!isNaN(pxNum) && baseSize > 0) {
            setRemValue(String(parseFloat((pxNum / baseSize).toFixed(4))));
        } else {
            setRemValue('');
        }
    };

    const handleRemChange = (value: string) => {
        setRemValue(value);
        const remNum = parseFloat(value);
        if (!isNaN(remNum) && baseSize > 0) {
            setPxValue(String(parseFloat((remNum * baseSize).toFixed(4))));
        } else {
            setPxValue('');
        }
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="PX to REM/EM Converter"
                description="Easily convert pixel values to REMs or EMs, and vice versa."
            />
            <Card>
                <label className="text-lg font-semibold text-white">Base Font Size (px)</label>
                <Input
                    type="number"
                    value={baseSize}
                    onChange={(e) => handleBaseChange(parseInt(e.target.value))}
                    className="mt-2 w-full md:w-48"
                />
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="flex items-center gap-4">
                    <div>
                        <label>Pixels (px)</label>
                        <Input type="number" value={pxValue} onChange={e => handlePxChange(e.target.value)} />
                    </div>
                     <span className="text-2xl text-slate-400 pt-6">=</span>
                    <div>
                        <label>REM / EM</label>
                        <Input type="number" value={remValue} onChange={e => handleRemChange(e.target.value)} />
                    </div>
                </Card>
                 <Card>
                    <h3 className="text-lg font-semibold text-white mb-3">Quick Reference</h3>
                    <div className="max-h-40 overflow-y-auto">
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-slate-800">
                            {commonPxValues.map(px => (
                                <tr key={px}>
                                    <td className="py-1 text-slate-400">{px}px</td>
                                    <td className="py-1 text-white font-mono text-right">{(px / baseSize).toFixed(3)}rem</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </ToolContainer>
    );
};
