import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';

const BASES = {
    'Decimal': 10,
    'Hexadecimal': 16,
    'Octal': 8,
    'Binary': 2,
};

type BaseName = keyof typeof BASES;

const isValidForBase = (value: string, base: number) => {
    if (!value) return true;
    if (base === 16) return /^[0-9a-fA-F]*$/.test(value);
    const regex = new RegExp(`^[0-${base - 1}]*$`);
    return regex.test(value);
};

export const BaseConverter: React.FC = () => {
    const [values, setValues] = useState({
        'Decimal': '42',
        'Hexadecimal': '2A',
        'Octal': '52',
        'Binary': '101010',
    });

    const handleValueChange = (baseName: BaseName, newValue: string) => {
        const base = BASES[baseName];
        if (!isValidForBase(newValue, base)) return;

        const decimalValue = newValue ? parseInt(newValue, base) : 0;

        if (isNaN(decimalValue)) {
            const newValues = { ...values, [baseName]: newValue };
            // Clear others if input is invalid but allowed (e.g., empty string)
            if (!newValue) {
                Object.keys(BASES).forEach(name => {
                    if (name !== baseName) newValues[name as BaseName] = '';
                });
            }
            setValues(newValues);
            return;
        }

        setValues({
            'Decimal': decimalValue.toString(10),
            'Hexadecimal': decimalValue.toString(16).toUpperCase(),
            'Octal': decimalValue.toString(8),
            'Binary': decimalValue.toString(2),
        });
    };

    return (
        <ToolContainer>
            <ToolHeader title="Base Converter" description="Convert numbers between Decimal, Hexadecimal, Octal, and Binary." />
            <Card className="space-y-4">
                {Object.entries(BASES).map(([name, base]) => (
                    <div key={name}>
                        <label className="text-sm font-medium text-slate-300 mb-1 block">{name} (Base {base})</label>
                        <Input 
                            value={values[name as BaseName]}
                            onChange={e => handleValueChange(name as BaseName, e.target.value)}
                            className="font-mono text-lg"
                        />
                    </div>
                ))}
            </Card>
        </ToolContainer>
    );
};