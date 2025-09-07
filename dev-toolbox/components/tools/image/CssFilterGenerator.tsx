
import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

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
    { name: 'saturate', value: 100, min: 0, max: 200, step: 1, unit: '%' },
    { name: 'grayscale', value: 0, min: 0, max: 100, step: 1, unit: '%' },
    { name: 'sepia', value: 0, min: 0, max: 100, step: 1, unit: '%' },
    { name: 'hue-rotate', value: 0, min: 0, max: 360, step: 1, unit: 'deg' },
    { name: 'invert', value: 0, min: 0, max: 100, step: 1, unit: '%' },
    { name: 'blur', value: 0, min: 0, max: 10, step: 0.1, unit: 'px' },
    { name: 'opacity', value: 100, min: 0, max: 100, step: 1, unit: '%' },
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

export const CssFilterGenerator: React.FC = () => {
    const [filters, setFilters] = useState<Filter[]>(initialFilters);
    const [imageSrc, setImageSrc] = useState('https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1287&q=80');
    const [isCopied, copy] = useCopyToClipboard();

    const handleFilterChange = (name: string, value: number) => {
        setFilters(prevFilters =>
            prevFilters.map(f => (f.name === name ? { ...f, value } : f))
        );
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageSrc(URL.createObjectURL(file));
        }
    };

    const cssFilterValue = useMemo(() => {
        return filters
            .map(f => `${f.name}(${f.value}${f.unit})`)
            .join(' ');
    }, [filters]);

    return (
        <ToolContainer>
            <ToolHeader
                title="CSS Image Filter Generator"
                description="Visually apply CSS filters to an image and copy the generated code."
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Controls</h3>
                        {filters.map(filter => (
                            <FilterSlider key={filter.name} filter={filter} onChange={handleFilterChange} />
                        ))}
                         <Button variant="secondary" onClick={() => setFilters(initialFilters)} className="w-full">Reset Filters</Button>
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <Card className="flex items-center justify-center p-4">
                         <img
                            src={imageSrc}
                            alt="Preview"
                            className="max-w-full max-h-[400px] rounded-md"
                            style={{ filter: cssFilterValue }}
                        />
                    </Card>
                     <Card>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                        />
                    </Card>
                    <Card>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-white">CSS Output</h3>
                            <Button variant="secondary" onClick={() => copy(`filter: ${cssFilterValue};`)}>
                                {isCopied ? 'Copied!' : 'Copy Code'}
                            </Button>
                        </div>
                        <pre className="text-sm bg-slate-900 rounded-md p-4 whitespace-pre-wrap break-all text-slate-300 font-mono">
                            <code>filter: {cssFilterValue};</code>
                        </pre>
                    </Card>
                </div>
            </div>
        </ToolContainer>
    );
};
