import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { tools } from './index';

const PhotoResizer: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'photo-resizer')!;
    const optionsConfig: ToolOptionConfig[] = [
        { name: 'width', label: 'Width (px)', type: 'number', defaultValue: 800 },
        { name: 'height', label: 'Height (px)', type: 'number', defaultValue: 600 },
    ];

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        // prompt should contain image base64
        const payload = { image_base64: prompt, ...options };
        const res = await fetch('https://nafsbackend.onrender.com/api/utility/resize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return res.json();
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            optionsConfig={optionsConfig}
            onGenerate={handleGenerate}
            renderOutput={(output: any) => (
                <div>
                    {output?.image_base64
                        ? <img src={output.image_base64} alt="resized" />
                        : <pre>{JSON.stringify(output, null, 2)}</pre>}
                </div>
            )}
        />
    );
};

export default PhotoResizer;
