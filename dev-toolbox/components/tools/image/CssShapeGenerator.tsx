import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Button } from '../../common/Button';

const shapes = {
    triangle: 'polygon(50% 0, 0 100%, 100% 100%)',
    trapezoid: 'polygon(20% 0, 80% 0, 100% 100%, 0 100%)',
    parallelogram: 'polygon(25% 0, 100% 0, 75% 100%, 0 100%)',
    rhombus: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
    pentagon: 'polygon(50% 0, 100% 38%, 81% 100%, 19% 100%, 0 38%)',
    hexagon: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
    star: 'polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    cross: 'polygon(20% 0, 80% 0, 80% 20%, 100% 20%, 100% 80%, 80% 80%, 80% 100%, 20% 100%, 20% 80%, 0 80%, 0 20%, 20% 20%)',
    message: 'polygon(0 0, 100% 0, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0 75%)',
};

type ShapeName = keyof typeof shapes;

export const CssShapeGenerator: React.FC = () => {
    const [selectedShape, setSelectedShape] = useState<ShapeName>('hexagon');
    const [isCopied, copy] = useCopyToClipboard();
    
    const clipPath = shapes[selectedShape];
    const cssCode = `clip-path: ${clipPath};`;

    return (
        <ToolContainer>
            <ToolHeader
                title="CSS Shape Generator"
                description="Create complex shapes using the CSS clip-path property and copy the code."
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-1">
                     <Card>
                         <h3 className="text-lg font-semibold text-white mb-3">Select a Shape</h3>
                         <div className="grid grid-cols-3 gap-2">
                             {Object.keys(shapes).map((shapeName) => (
                                <button
                                    key={shapeName}
                                    onClick={() => setSelectedShape(shapeName as ShapeName)}
                                    className={`capitalize p-2 rounded-md text-sm transition-colors ${selectedShape === shapeName ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}
                                >
                                    {shapeName}
                                </button>
                             ))}
                         </div>
                     </Card>
                </div>
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                         <h3 className="text-lg font-semibold text-white mb-2">Preview</h3>
                         <div className="flex items-center justify-center h-64 bg-slate-800 rounded-md p-4">
                            <div className="w-48 h-48 bg-gradient-to-r from-indigo-500 to-purple-500" style={{ clipPath }}></div>
                         </div>
                    </Card>
                    <Card className="relative">
                        <h3 className="text-lg font-semibold text-white mb-2">CSS Code</h3>
                        <pre className="text-sm bg-slate-900 rounded-md p-4 font-mono">
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
