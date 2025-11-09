import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

interface ShadowLayer {
    offsetX: number;
    offsetY: number;
    blur: number;
    spread: number;
    color: string;
    inset: boolean;
}

const initialLayer: ShadowLayer = {
    offsetX: 10,
    offsetY: 10,
    blur: 5,
    spread: 0,
    color: '#000000',
    inset: false,
};

const Slider: React.FC<{ label: string, value: number, onChange: (v:number)=>void, min?: number, max?: number, step?: number }> = ({ label, value, onChange, ...props }) => (
    <div>
        <label className="flex justify-between text-sm"><span>{label}</span><span>{value}px</span></label>
        <input type="range" value={value} onChange={e => onChange(parseInt(e.target.value))} className="w-full" {...props} />
    </div>
);

export const BoxShadowGenerator: React.FC = () => {
    const [layers, setLayers] = useState<ShadowLayer[]>([initialLayer]);
    const [activeLayer, setActiveLayer] = useState(0);
    const [isCopied, copy] = useCopyToClipboard();

    const boxShadowCss = useMemo(() => {
        return layers.map(l => `${l.inset ? 'inset ' : ''}${l.offsetX}px ${l.offsetY}px ${l.blur}px ${l.spread}px ${l.color}`).join(', ');
    }, [layers]);

    const updateLayer = (index: number, newProps: Partial<ShadowLayer>) => {
        setLayers(layers.map((l, i) => i === index ? { ...l, ...newProps } : l));
    };

    const current = layers[activeLayer];

    return (
        <ToolContainer>
            <ToolHeader
                title="CSS Box Shadow Generator"
                description="Visually create complex, layered box-shadow effects."
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-3">Layers</h3>
                        <div className="space-y-2">
                        {layers.map((l, i) => (
                            <div key={i} className={`flex justify-between items-center p-2 rounded cursor-pointer ${activeLayer === i ? 'bg-indigo-600' : 'bg-slate-800'}`} onClick={() => setActiveLayer(i)}>
                                <span className="text-sm truncate">{`${l.offsetX}px ${l.offsetY}px ${l.color}`}</span>
                                {/* FIX: Replaced invalid 'size' prop with 'className' to provide custom styling for a smaller button. */}
                                <Button className="px-2 py-1 text-xs" variant="danger" onClick={(e) => { e.stopPropagation(); setLayers(layers.filter((_, idx) => idx !== i)); if(activeLayer >= i) setActiveLayer(Math.max(0, activeLayer - 1)); }} disabled={layers.length === 1}>X</Button>
                            </div>
                        ))}
                        </div>
                        <Button onClick={() => { setLayers([...layers, {...initialLayer}]); setActiveLayer(layers.length); }} className="w-full mt-3">Add Layer</Button>
                    </Card>
                    <Card className="space-y-3">
                         <h3 className="text-lg font-semibold text-white">Layer {activeLayer + 1} Settings</h3>
                         <Slider label="Offset X" value={current.offsetX} onChange={v => updateLayer(activeLayer, {offsetX: v})} min={-50} max={50} />
                         <Slider label="Offset Y" value={current.offsetY} onChange={v => updateLayer(activeLayer, {offsetY: v})} min={-50} max={50} />
                         <Slider label="Blur" value={current.blur} onChange={v => updateLayer(activeLayer, {blur: v})} min={0} max={100} />
                         <Slider label="Spread" value={current.spread} onChange={v => updateLayer(activeLayer, {spread: v})} min={-50} max={50} />
                         <div className="flex items-center gap-4">
                            <input type="color" value={current.color} onChange={e => updateLayer(activeLayer, {color: e.target.value})} className="w-12 h-12 p-0 border-none bg-transparent" />
                            <label className="flex items-center gap-2"><input type="checkbox" checked={current.inset} onChange={e => updateLayer(activeLayer, {inset: e.target.checked})} /> Inset</label>
                         </div>
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-4">
                    <Card className="h-80 flex items-center justify-center bg-slate-700">
                        <div className="w-40 h-40 bg-white rounded-md" style={{ boxShadow: boxShadowCss }}></div>
                    </Card>
                    <Card className="relative">
                        <h3 className="text-lg font-semibold text-white mb-2">CSS Code</h3>
                        <pre className="text-sm bg-slate-900 rounded-md p-4 font-mono break-all"><code>box-shadow: {boxShadowCss};</code></pre>
                         <Button onClick={() => copy(`box-shadow: ${boxShadowCss};`)} className="absolute top-4 right-4 text-xs" variant="secondary">{isCopied ? 'Copied!' : 'Copy'}</Button>
                    </Card>
                </div>
            </div>
        </ToolContainer>
    );
};