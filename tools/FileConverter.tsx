import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { tools } from './index';

const FileConverter: React.FC = () => {
  const toolInfo = tools.find(t => t.id === 'file-converter')!;
  const optionsConfig: ToolOptionConfig[] = [
    {
      name: 'format',
      label: 'Output Format',
      type: 'select',
      defaultValue: 'pdf',
      options: [{ value: 'pdf', label: 'PDF' }],
    },
  ];

  const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
    const payload = { text: prompt };
    const res = await fetch('https://nafsbackend.onrender.com/api/utility/convert', {
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
          {output?.pdf_base64 ? (
            <a
              href={output.pdf_base64}
              download="converted.pdf"
              className="text-blue-600 underline"
            >
              Download PDF
            </a>
          ) : (
            <pre>{JSON.stringify(output, null, 2)}</pre>
          )}
        </div>
      )}
    />
  );
};

export default FileConverter;
