import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { useToolTelemetry } from '../../common/useToolTelemetry';

const LOREM_IPSUM_TEXT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.";

export const LoremIpsumGenerator: React.FC = () => {
    const [paragraphs, setParagraphs] = useState(3);
    const [generatedText, setGeneratedText] = useState('');
    const [isCopied, copyToClipboard] = useCopyToClipboard();

    const handleGenerate = () => {
        let result = '';
        for (let i = 0; i < paragraphs; i++) {
            result += LOREM_IPSUM_TEXT + '\n\n';
        }
        const trimmed = result.trim();
        setGeneratedText(trimmed);
        try { recordUsage(String(paragraphs), trimmed); } catch (e) { }
    };

    const recordUsage = useToolTelemetry('lorem-ipsum-generator', 'Lorem Ipsum Generator', 'Text');

    return (
        <ToolContainer>
            <ToolHeader
                title="Lorem Ipsum Generator"
                description="Generate placeholder text for your designs and documents."
            />
            <Card>
                <div className="flex items-center gap-4">
                    <label htmlFor="paragraphs" className="text-slate-300">Paragraphs:</label>
                    <Input
                        id="paragraphs"
                        type="number"
                        min="1"
                        max="50"
                        value={paragraphs}
                        onChange={(e) => setParagraphs(parseInt(e.target.value, 10))}
                        className="w-24"
                    />
                    <Button onClick={handleGenerate}>Generate</Button>
                </div>
            </Card>

            {generatedText && (
                <Card className="relative">
                    <pre className="whitespace-pre-wrap break-words text-slate-300 max-h-96 overflow-y-auto">{generatedText}</pre>
                     <Button
                        onClick={() => copyToClipboard(generatedText)}
                        className="absolute top-4 right-4 px-3 py-1 text-sm"
                        variant="secondary"
                    >
                        {isCopied ? 'Copied!' : 'Copy'}
                    </Button>
                </Card>
            )}
        </ToolContainer>
    );
};
