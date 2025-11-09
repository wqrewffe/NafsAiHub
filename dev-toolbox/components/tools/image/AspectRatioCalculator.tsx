import React, { useState, useEffect } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';

export const AspectRatioCalculator: React.FC = () => {
    const [ratioW, setRatioW] = useState(16);
    const [ratioH, setRatioH] = useState(9);
    const [width, setWidth] = useState(1920);
    const [height, setHeight] = useState(1080);
    const [lastChanged, setLastChanged] = useState<'width' | 'height'>('width');

    useEffect(() => {
        if (ratioW > 0 && ratioH > 0) {
            if (lastChanged === 'width') {
                const newHeight = Math.round((width * ratioH) / ratioW);
                if (height !== newHeight) setHeight(newHeight);
            } else {
                const newWidth = Math.round((height * ratioW) / ratioH);
                if (width !== newWidth) setWidth(newWidth);
            }
        }
    }, [width, height, ratioW, ratioH, lastChanged]);

    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setWidth(Number(e.target.value));
        setLastChanged('width');
    };

    const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHeight(Number(e.target.value));
        setLastChanged('height');
    };

    const handleRatioWChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newRatioW = Number(e.target.value);
        setRatioW(newRatioW);
        if (newRatioW > 0 && ratioH > 0) {
            setHeight(Math.round((width * ratioH) / newRatioW));
        }
    };
    
    const handleRatioHChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newRatioH = Number(e.target.value);
        setRatioH(newRatioH);
        if (ratioW > 0 && newRatioH > 0) {
            setHeight(Math.round((width * newRatioH) / ratioW));
        }
    };


    return (
        <ToolContainer>
            <ToolHeader
                title="Aspect Ratio Calculator"
                description="Calculate image or video dimensions based on a specific aspect ratio."
            />
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Aspect Ratio</h3>
                        <div className="flex items-center gap-2">
                            <Input type="number" value={ratioW} onChange={handleRatioWChange} aria-label="Ratio Width" />
                            <span className="text-slate-400">:</span>
                            <Input type="number" value={ratioH} onChange={handleRatioHChange} aria-label="Ratio Height" />
                        </div>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Dimensions (in pixels)</h3>
                         <div className="flex items-center gap-2">
                            <Input type="number" value={width} onChange={handleWidthChange} aria-label="Width" />
                            <span className="text-slate-400">x</span>
                            <Input type="number" value={height} onChange={handleHeightChange} aria-label="Height" />
                        </div>
                    </div>
                </div>
            </Card>
        </ToolContainer>
    );
};
