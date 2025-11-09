import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { tools } from './index';

const FileCompressor: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'file-compressor')!;
    const optionsConfig: ToolOptionConfig[] = [];

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        // prompt should be JSON array of { name, data_base64 }
        let files = [];
        try {
            files = JSON.parse(prompt);
        } catch (e) {
            return { error: 'Invalid files JSON' };
        }

        const res = await fetch('https://nafsbackend.onrender.com/api/utility/compress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files }),
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
                    {output?.zip_base64 ? (
                        <a href={output.zip_base64} target="_blank" rel="noreferrer">
                            Download ZIP
                        </a>
                    ) : (
                        <pre>{JSON.stringify(output, null, 2)}</pre>
                    )}
                </div>
            )}
        />
    );
};

export default FileCompressor;
