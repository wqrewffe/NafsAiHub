import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Input } from '../../common/Input';

interface Filter {
    name: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit: string;
}

const initialFilters: Filter[] = [
    { name: 'brightness', value: 100, min: 0, max: 200, step: 1, unit: '%' },
    { name: 'contrast', value: 100, min: 0, max: 200, step: 1, unit: '%' },
    { name: 'saturate', value: 100, min: 0, max: 300, step: 1, unit: '%' },
    { name: 'hue-rotate', value: 0, min: 0, max: 360, step: 1, unit: 'deg' },
    { name: 'sepia', value: 0, min: 0, max: 100, step: 1, unit: '%' },
    { name: 'invert', value: 0, min: 0, max: 100, step: 1, unit: '%' },
];

const FilterSlider: React.FC<{ filter: Filter; onChange: (name: string, value: number) => void }> = ({ filter, onChange }) => (
    <div>
        <label className="flex justify-between text-sm text-slate-300">
            <span className="capitalize">{filter.name.replace('-', ' ')}</span>
            <span>{filter.value}{filter.unit}</span>
        </label>
        <input
            type="range"
            min={filter.min}
            max={filter.max}
            step={filter.step}
            value={filter.value}
            onChange={(e) => onChange(filter.name, parseFloat(e.target.value))}
            className="w-full mt-1"
        />
    </div>
);

export const CssFilterPlayground: React.FC = () => {
    const [filters, setFilters] = useState<Filter[]>(initialFilters);
    const [baseColor, setBaseColor] = useState('#3B82F6'); // blue-500
    const [isCopied, copy] = useCopyToClipboard();

    const cssFilterValue = useMemo(() => {
        return filters
            .map(f => `${f.name}(${f.value}${f.unit})`)
            .join(' ');
    }, [filters]);
    
    const cssCode = `background-color: ${baseColor};\nfilter: ${cssFilterValue};`;

    return (
        <ToolContainer>
            <ToolHeader
                title="CSS Filter Playground"
                description="See how CSS filters affect a solid color and get the resulting code."
            />
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <label className="text-sm">Base Color</label>
                        <Input type="color" value={baseColor} onChange={e => setBaseColor(e.target.value)} className="w-full h-12 p-1" />
                    </Card>
                    <Card className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Filters</h3>
                        {filters.map(filter => (
                            <FilterSlider key={filter.name} filter={filter} onChange={(name, val) => setFilters(prev => prev.map(f => f.name === name ? {...f, value: val} : f))} />
                        ))}
                         <Button variant="secondary" onClick={() => setFilters(initialFilters)} className="w-full">Reset Filters</Button>
                    </Card>
                </div>
                 <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Result</h3>
                        <div className="h-48 rounded-md" style={{ backgroundColor: baseColor, filter: cssFilterValue }}></div>
                    </Card>
                    <Card className="relative">
                        <h3 className="text-lg font-semibold text-white mb-2">CSS Code</h3>
                        <pre className="text-sm bg-slate-900 rounded-md p-4 font-mono whitespace-pre-wrap">
                            <code>{cssCode}</code>
                        </pre>
                         <Button
                            onClick={() => copy(cssCode)}
                            className="absolute top-4 right-4 px-3 py-1 text-xs"
                            variant="secondary"
                        >
                            {isCopied ? 'Copied!' : 'Copy'}
                        </Button>
                    </Card>
                 </div>
            </div>
        </ToolContainer>
    );
};
