import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

const ControlSlider: React.FC<{ label: string; value: number; onChange: (v: number) => void; min: number; max: number; unit?: string }> = ({ label, value, onChange, min, max, unit = '' }) => (
    <div>
        <label className="flex justify-between text-sm text-slate-300">
            <span>{label}</span>
            <span>{value}{unit}</span>
        </label>
        <input type="range" value={value} onChange={e => onChange(parseInt(e.target.value))} min={min} max={max} className="w-full" />
    </div>
);

export const CssGridLayoutGenerator: React.FC = () => {
    const [columns, setColumns] = useState(4);
    const [rows, setRows] = useState(3);
    const [colGap, setColGap] = useState(16);
    const [rowGap, setRowGap] = useState(16);
    const [isCopied, copy] = useCopyToClipboard();

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        columnGap: `${colGap}px`,
        rowGap: `${rowGap}px`,
        height: '300px',
    };
    
    const cssCode = `.grid-container {
  display: grid;
  grid-template-columns: repeat(${columns}, 1fr);
  grid-template-rows: repeat(${rows}, 1fr);
  column-gap: ${colGap}px;
  row-gap: ${rowGap}px;
}`;

    return (
        <ToolContainer>
            <ToolHeader title="CSS Grid Layout Generator" description="Visually create a CSS grid layout and get the code." />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 space-y-4">
                    <h3 className="text-lg font-semibold text-white">Grid Settings</h3>
                    <ControlSlider label="Columns" value={columns} onChange={setColumns} min={1} max={12} />
                    <ControlSlider label="Rows" value={rows} onChange={setRows} min={1} max={12} />
                    <ControlSlider label="Column Gap" value={colGap} onChange={setColGap} min={0} max={50} unit="px" />
                    <ControlSlider label="Row Gap" value={rowGap} onChange={setRowGap} min={0} max={50} unit="px" />
                </Card>
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Preview</h3>
                        <div style={gridStyle as React.CSSProperties}>
                            {Array.from({ length: columns * rows }).map((_, i) => (
                                <div key={i} className="bg-indigo-500/50 border border-indigo-400 rounded-md flex items-center justify-center text-indigo-200 text-sm">
                                    {i + 1}
                                </div>
                            ))}
                        </div>
                    </Card>
                    <Card className="relative">
                        <h3 className="text-lg font-semibold text-white mb-2">CSS Code</h3>
                        <pre className="text-sm bg-slate-900 rounded-md p-4 font-mono whitespace-pre-wrap">
                            <code>{cssCode}</code>
                        </pre>
                        <Button onClick={() => copy(cssCode)} className="absolute top-4 right-4 text-xs" variant="secondary">{isCopied ? 'Copied!' : 'Copy'}</Button>
                    </Card>
                </div>
            </div>
        </ToolContainer>
    );
};