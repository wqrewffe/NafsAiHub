import React, { useState } from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { tools } from './index';

const QRCodeGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'qrcode-generator')!;
    const optionsConfig: ToolOptionConfig[] = [
        { name: 'size', label: 'Size (px)', type: 'number', defaultValue: 256 },
    ];

    const [qrCode, setQrCode] = useState<string | null>(null);

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const payload = { text: prompt, size: options.size };
        const res = await fetch('https://nafsbackend.onrender.com/api/utility/qrcode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        setQrCode(data?.qrcode_base64 || null);
        return data;
    };

    const handleDownload = () => {
        if (!qrCode) return;
        const link = document.createElement('a');
        link.href = qrCode;
        link.download = 'qrcode.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            optionsConfig={optionsConfig}
            onGenerate={handleGenerate}
            renderOutput={() => (
                <div className="flex flex-col items-center gap-4">
                    {qrCode ? (
                        <>
                            <img src={qrCode} alt="QR Code" className="rounded-lg shadow-md" />
                            <button
                                onClick={handleDownload}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Download
                            </button>
                        </>
                    ) : (
                        <p className="text-gray-500">Generate a QR code to see it here.</p>
                    )}
                </div>
            )}
        />
    );
};

export default QRCodeGenerator;
