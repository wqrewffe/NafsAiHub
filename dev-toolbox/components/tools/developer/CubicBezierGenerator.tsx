import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Input } from '../../common/Input';

// --- Hooks ---
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prevState: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((prevState: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}

// --- Types ---
interface Point { x: number; y: number; }
interface Preset { name: string; values: [number, number, number, number]; }

// --- Constants ---
const PRESETS: Preset[] = [
    { name: 'ease', values: [0.25, 0.1, 0.25, 1.0] },
    { name: 'linear', values: [0.0, 0.0, 1.0, 1.0] },
    { name: 'ease-in', values: [0.42, 0.0, 1.0, 1.0] },
    { name: 'ease-out', values: [0.0, 0.0, 0.58, 1.0] },
    { name: 'ease-in-out', values: [0.42, 0.0, 0.58, 1.0] },
];
const GRAPH_SIZE = 300;
const P0 = { x: 0, y: 0 };
const P3 = { x: 1, y: 1 };


// --- Main Component ---
export const CubicBezierGenerator: React.FC = () => {
    const [p1, setP1] = useState<Point>({ x: 0.42, y: 0.0 });
    const [p2, setP2] = useState<Point>({ x: 0.58, y: 1.0 });
    const [duration, setDuration] = useState(2);
    const [customPresets, setCustomPresets] = useLocalStorage<Preset[]>('bezier-presets', []);
    
    const [dragging, setDragging] = useState<'p1' | 'p2' | null>(null);
    const [animationKey, setAnimationKey] = useState(Date.now());
    const [isCopied, copy] = useCopyToClipboard();
    const [isAnimating, setIsAnimating] = useState(false);
    
    const svgRef = useRef<SVGSVGElement>(null);
    const timelineDotRef = useRef<SVGCircleElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    
    const bezierString = useMemo(() => 
        `cubic-bezier(${p1.x.toFixed(3)}, ${p1.y.toFixed(3)}, ${p2.x.toFixed(3)}, ${p2.y.toFixed(3)})`, 
    [p1, p2]);

    // --- Event Handlers for Dragging ---
    const handleMouseDown = (point: 'p1' | 'p2') => (e: React.MouseEvent) => {
        e.preventDefault();
        setDragging(point);
    };

    // FIX: The method `getScreenCTM()` was causing a type error. Replaced the mouse move handler logic to use `getBoundingClientRect()` for coordinate calculations, which avoids the problematic method and achieves the same result for converting screen coordinates to SVG user space coordinates.
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragging || !svgRef.current) return;
        const svg = svgRef.current;
        const rect = svg.getBoundingClientRect();

        // Convert screen coordinates to SVG user space coordinates
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const viewBox = svg.viewBox.baseVal;
        const userX = viewBox.x + x * viewBox.width;
        const userY = viewBox.y + y * viewBox.height;

        const newPoint = {
            // Clamp values between 0 and 1, relative to the graph area
            x: Math.max(0, Math.min(1, userX / GRAPH_SIZE)),
            y: 1 - (userY / GRAPH_SIZE), // Y is inverted for mathematical representation
        };

        if (dragging === 'p1') setP1(newPoint);
        else setP2(newPoint);
    }, [dragging]);

    const handleMouseUp = useCallback(() => setDragging(null), []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    // --- Animation Logic ---
    const triggerAnimation = useCallback(() => {
        setAnimationKey(Date.now()); // For graph dot
        setIsAnimating(false);
        
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setIsAnimating(true));
        });
    }, []);

    useEffect(() => {
        triggerAnimation();
    }, [triggerAnimation]);

    useEffect(() => {
        const dot = timelineDotRef.current;
        if (!dot) return;

        let startTime: number | null = null;
        
        const B = (t: number, p0: number, p1: number, p2: number, p3: number) => 
            Math.pow(1-t, 3) * p0 + 
            3 * Math.pow(1-t, 2) * t * p1 + 
            3 * (1-t) * Math.pow(t, 2) * p2 + 
            Math.pow(t, 3) * p3;

        const animateDot = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / (duration * 1000), 1);

            const x = B(progress, P0.x, p1.x, p2.x, P3.x);
            const y = B(progress, P0.y, p1.y, p2.y, P3.y);

            dot.setAttribute('cx', String(x * GRAPH_SIZE));
            dot.setAttribute('cy', String((1 - y) * GRAPH_SIZE));

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animateDot);
            }
        };

        animationFrameRef.current = requestAnimationFrame(animateDot);

        return () => {
            if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
    }, [animationKey, duration, p1, p2]);


    // --- Preset Management ---
    const loadPreset = (values: [number, number, number, number]) => {
        setP1({ x: values[0], y: values[1] });
        setP2({ x: values[2], y: values[3] });
        triggerAnimation();
    };

    const savePreset = () => {
        const name = prompt("Enter a name for your preset:", "My Ease");
        if (name) {
            const newPreset: Preset = {
                name,
                values: [parseFloat(p1.x.toFixed(3)), parseFloat(p1.y.toFixed(3)), parseFloat(p2.x.toFixed(3)), parseFloat(p2.y.toFixed(3))]
            };
            setCustomPresets([...customPresets, newPreset]);
        }
    };

    const deletePreset = (name: string) => {
        if (window.confirm(`Are you sure you want to delete the "${name}" preset?`)) {
            setCustomPresets(customPresets.filter(p => p.name !== name));
        }
    };

    const handleNumericChange = (point: 'p1' | 'p2', axis: 'x' | 'y', value: string) => {
        const numValue = parseFloat(value);
        if(isNaN(numValue)) return;
        
        if(point === 'p1') setP1({...p1, [axis]: numValue});
        if(point === 'p2') setP2({...p2, [axis]: numValue});
    };
    
    const pathData = `M 0 ${GRAPH_SIZE} C ${p1.x * GRAPH_SIZE} ${(1 - p1.y) * GRAPH_SIZE}, ${p2.x * GRAPH_SIZE} ${(1 - p2.y) * GRAPH_SIZE}, ${GRAPH_SIZE} 0`;
    const easeInOutPath = `M 0 ${GRAPH_SIZE} C ${0.42 * GRAPH_SIZE} ${(1 - 0.0) * GRAPH_SIZE}, ${0.58 * GRAPH_SIZE} ${(1 - 1.0) * GRAPH_SIZE}, ${GRAPH_SIZE} 0`;

    return (
        <ToolContainer>
            <ToolHeader
                title="Advanced Cubic Bezier Generator"
                description="Visually craft CSS easing functions, compare them, and see them in action."
            />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                <div className="space-y-4">
                     <Card>
                        <h3 className="text-lg font-semibold text-white mb-3">Presets</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {PRESETS.map(p => <Button key={p.name} variant="secondary" onClick={() => loadPreset(p.values)}>{p.name}</Button>)}
                        </div>
                        {customPresets.length > 0 && <h4 className="text-md font-semibold text-white mt-4 mb-2">My Presets</h4>}
                        <div className="space-y-2">
                        {customPresets.map(p => (
                            <div key={p.name} className="flex gap-2">
                                <Button variant="secondary" onClick={() => loadPreset(p.values)} className="flex-grow text-left">{p.name}</Button>
                                <Button variant="danger" onClick={() => deletePreset(p.name)} className="px-2">&times;</Button>
                            </div>
                        ))}
                        </div>
                    </Card>
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-3">Coordinates</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-slate-300 mb-1">Point 1 (Blue)</p>
                                <div className="flex gap-2">
                                    <Input addon="x" type="number" step="0.01" value={p1.x.toFixed(3)} onChange={e => handleNumericChange('p1', 'x', e.target.value)} />
                                    <Input addon="y" type="number" step="0.01" value={p1.y.toFixed(3)} onChange={e => handleNumericChange('p1', 'y', e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-300 mb-1">Point 2 (Purple)</p>
                                <div className="flex gap-2">
                                    <Input addon="x" type="number" step="0.01" value={p2.x.toFixed(3)} onChange={e => handleNumericChange('p2', 'x', e.target.value)} />
                                    <Input addon="y" type="number" step="0.01" value={p2.y.toFixed(3)} onChange={e => handleNumericChange('p2', 'y', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="items-center justify-center flex">
                    <svg ref={svgRef} viewBox={`-10 -10 ${GRAPH_SIZE + 20} ${GRAPH_SIZE + 20}`} className="touch-none bg-slate-800 rounded-md cursor-pointer">
                        <defs>
                            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#475569" strokeWidth="0.5"/>
                            </pattern>
                        </defs>
                        <rect width={GRAPH_SIZE} height={GRAPH_SIZE} fill="url(#grid)" />
                        <path d={easeInOutPath} strokeWidth="1" stroke="#475569" fill="none" strokeDasharray="4"/>
                        <path d={pathData} strokeWidth="3" stroke="#A5B4FC" fill="none" />
                        <line x1="0" y1={GRAPH_SIZE} x2={p1.x * GRAPH_SIZE} y2={(1 - p1.y) * GRAPH_SIZE} stroke="#60A5FA" strokeWidth="1" />
                        <line x1={GRAPH_SIZE} y1="0" x2={p2.x * GRAPH_SIZE} y2={(1 - p2.y) * GRAPH_SIZE} stroke="#C084FC" strokeWidth="1" />
                        <circle cx={p1.x * GRAPH_SIZE} cy={(1 - p1.y) * GRAPH_SIZE} r="8" fill="#3B82F6" onMouseDown={handleMouseDown('p1')} className="cursor-move" />
                        <circle cx={p2.x * GRAPH_SIZE} cy={(1 - p2.y) * GRAPH_SIZE} r="8" fill="#A855F7" onMouseDown={handleMouseDown('p2')} className="cursor-move" />
                        <circle ref={timelineDotRef} r="5" fill="#F87171" />
                    </svg>
                </Card>

                <div className="space-y-4">
                     <Card>
                        <h3 className="text-lg font-semibold text-white mb-3">Live Preview</h3>
                        <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg overflow-hidden">
                           <div 
                                className={`w-10 h-10 bg-indigo-500 rounded-md`} 
                                style={{ 
                                    transition: `all ${duration}s ${bezierString}`,
                                    transform: isAnimating ? 'translateX(calc(100% - 40px))' : 'translateX(0)',
                                    backgroundColor: isAnimating ? '#a5b4fc' : '#4f46e5',
                                }}
                            ></div>
                           <div 
                                className="w-10 h-10 bg-purple-500 rounded-md" 
                                style={{ 
                                    transition: `transform ${duration}s ${bezierString}`,
                                    transform: isAnimating ? 'scale(1.5)' : 'scale(1)',
                                }}
                            ></div>
                           <div 
                                className="w-10 h-10 bg-pink-500 rounded-md" 
                                style={{ 
                                    transition: `opacity ${duration}s ${bezierString}`,
                                    opacity: isAnimating ? 0.2 : 1,
                                }}
                            ></div>
                        </div>
                        <div className="mt-4">
                            <label className="text-sm">Duration: {duration.toFixed(1)}s</label>
                            <input type="range" min="0.5" max="5" step="0.1" value={duration} onChange={e => setDuration(parseFloat(e.target.value))} className="w-full" />
                        </div>
                        <Button onClick={triggerAnimation} className="w-full mt-2">Replay Animation</Button>
                    </Card>
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Generated Code</h3>
                        <pre className="text-sm bg-slate-900 rounded-md p-4 font-mono whitespace-pre-wrap">
                            <code>{`.element {\n  transition: all ${duration}s ${bezierString};\n}`}</code>
                        </pre>
                        <div className="mt-2 flex gap-2">
                           <Button onClick={() => copy(`.element { transition: all ${duration}s ${bezierString}; }`)} variant="secondary" className="flex-grow">{isCopied ? 'Copied!' : 'Copy Rule'}</Button>
                           <Button onClick={savePreset}>Save Curve</Button>
                        </div>
                    </Card>
                </div>
            </div>
        </ToolContainer>
    );
};
