import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

const easings = {
    'ease': 'ease',
    'linear': 'linear',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out',
    'cubic-bezier(0.6, -0.28, 0.735, 0.045)': 'easeInBack',
    'cubic-bezier(0.68, -0.55, 0.265, 1.55)': 'easeInOutBack',
    'cubic-bezier(0.175, 0.885, 0.32, 1.275)': 'easeOutBack',
};

export const CssEasingVisualizer: React.FC = () => {
    const [selectedEasing, setSelectedEasing] = useState('ease-in-out');
    const [isAnimating, setIsAnimating] = useState(false);
    const [isCopied, copy] = useCopyToClipboard();
    
    const triggerAnimation = () => {
        setIsAnimating(false);
        setTimeout(() => setIsAnimating(true), 50);
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="CSS Easing Visualizer"
                description="Compare different CSS transition timing functions and copy the code."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <Card>
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-white">Selected: <code className="text-indigo-400">{selectedEasing}</code></h3>
                             <Button onClick={triggerAnimation}>Animate</Button>
                        </div>
                    </Card>
                    <Card>
                         <h3 className="text-lg font-semibold text-white mb-3">Easing Functions</h3>
                         <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {Object.entries(easings).map(([value, name]) => (
                                <Button
                                    key={name}
                                    variant={selectedEasing === value ? 'primary' : 'secondary'}
                                    onClick={() => setSelectedEasing(value)}
                                    className="w-full"
                                >
                                    {name}
                                </Button>
                            ))}
                         </div>
                    </Card>
                     <Card className="relative">
                        <h3 className="text-lg font-semibold text-white mb-2">CSS Code</h3>
                        <pre className="text-sm bg-slate-900 rounded-md p-4 font-mono">
                            <code>transition-timing-function: {selectedEasing};</code>
                        </pre>
                         <Button
                            onClick={() => copy(`transition-timing-function: ${selectedEasing};`)}
                            className="absolute top-4 right-4 px-3 py-1 text-xs"
                            variant="secondary"
                        >
                            {isCopied ? 'Copied!' : 'Copy'}
                        </Button>
                    </Card>
                </div>
                 <Card>
                    <div className="w-full h-80 bg-slate-900 rounded-md p-4 overflow-hidden relative">
                         <div 
                            className={`w-12 h-12 bg-indigo-500 rounded-full absolute ${isAnimating ? 'left-[calc(100%-4rem)]' : 'left-4'}`}
                            style={{
                                transition: 'left 2s',
                                transitionTimingFunction: selectedEasing,
                                top: '50px'
                            }}
                        ></div>
                         <div 
                            className={`w-12 h-12 bg-purple-500 rounded-full absolute ${isAnimating ? 'left-[calc(100%-4rem)]' : 'left-4'}`}
                            style={{
                                transition: 'left 2s ease-in-out',
                                top: '150px'
                            }}
                        >
                            <span className="text-xs absolute -top-5 left-0 text-white">ease-in-out</span>
                        </div>
                    </div>
                </Card>
            </div>
        </ToolContainer>
    );
};
