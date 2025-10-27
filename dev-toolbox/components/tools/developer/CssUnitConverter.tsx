import React, { useState, useEffect } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Select } from '../../common/Select';

type Unit = 'px' | 'pt' | 'pc' | 'in' | 'cm' | 'mm' | 'rem' | 'em';
const DPI = 96;

const CONVERSION_TO_PX: Record<Unit, (val: number, base: number) => number> = {
    px: val => val,
    pt: val => val * DPI / 72,
    pc: val => val * DPI / 6,
    in: val => val * DPI,
    cm: val => val * DPI / 2.54,
    mm: val => val * DPI / 25.4,
    rem: (val, base) => val * base,
    em: (val, base) => val * base,
};

const CONVERSION_FROM_PX: Record<Unit, (val: number, base: number) => number> = {
    px: val => val,
    pt: val => val * 72 / DPI,
    pc: val => val * 6 / DPI,
    in: val => val / DPI,
    cm: val => val * 2.54 / DPI,
    mm: val => val * 25.4 / DPI,
    rem: (val, base) => val / base,
    em: (val, base) => val / base,
};

export const CssUnitConverter: React.FC = () => {
    const [fromValue, setFromValue] = useState('16');
    const [fromUnit, setFromUnit] = useState<Unit>('px');
    const [toValue, setToValue] = useState('1');
    const [toUnit, setToUnit] = useState<Unit>('rem');
    const [baseSize, setBaseSize] = useState(16);

    useEffect(() => {
        const value = parseFloat(fromValue);
        if (isNaN(value)) {
            setToValue('');
            return;
        }
        const valueInPx = CONVERSION_TO_PX[fromUnit](value, baseSize);
        const convertedValue = CONVERSION_FROM_PX[toUnit](valueInPx, baseSize);
        setToValue(parseFloat(convertedValue.toFixed(4)).toString());
    }, [fromValue, fromUnit, toUnit, baseSize]);

    const handleFromValueChange = (val: string) => {
        setFromValue(val);
    };
    
    return (
        <ToolContainer>
            <ToolHeader
                title="CSS Unit Converter"
                description="Convert between various absolute and relative CSS length units."
            />
            <Card>
                <label>Base Font Size (for rem/em):</label>
                <Input type="number" value={baseSize} onChange={e => setBaseSize(parseInt(e.target.value) || 16)} className="w-32 mt-1" />
            </Card>
            <Card className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex gap-2">
                    <Input type="number" value={fromValue} onChange={e => handleFromValueChange(e.target.value)} />
                    <Select value={fromUnit} onChange={e => setFromUnit(e.target.value as Unit)}>
                        {Object.keys(CONVERSION_TO_PX).map(u => <option key={u}>{u}</option>)}
                    </Select>
                </div>
                <span className="text-2xl text-slate-400">=</span>
                 <div className="flex gap-2">
                    <Input type="number" value={toValue} readOnly className="bg-slate-800/50" />
                    <Select value={toUnit} onChange={e => setToUnit(e.target.value as Unit)}>
                         {Object.keys(CONVERSION_FROM_PX).map(u => <option key={u}>{u}</option>)}
                    </Select>
                </div>
            </Card>
        </ToolContainer>
    );
};
