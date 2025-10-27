import React, { useState } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Textarea } from '../../common/Textarea';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { explainCode } from '../../../services/geminiService';
import { Select } from '../../common/Select';

// Basic markdown to HTML renderer
const renderMarkdown = (text: string) => {
    return text
        .replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre class="bg-slate-900 p-2 rounded"><code>$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code class="bg-slate-700 rounded px-1 py-0.5">$1</code>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/(\n|^)- (.+)/g, '$1<li class="ml-4 list-disc">$2</li>');
};

export const AICodeExplainer: React.FC = () => {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [explanation, setExplanation] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleExplain = async () => {
        if (!code.trim()) return;
        setIsLoading(true);
        setExplanation('');
        const result = await explainCode(code, language);
        setExplanation(result);
        setIsLoading(false);
    };

    return (
        <ToolContainer>
            <ToolHeader
                title="AI Code Explainer"
                description="Paste a code snippet and get a clear explanation of what it does."
            />
            <Card>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold text-white mb-2">Code Snippet</h3>
                        <Textarea
                            placeholder="Paste your code here..."
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            rows={10}
                            className="font-mono text-sm"
                        />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Language</h3>
                        <Select value={language} onChange={e => setLanguage(e.target.value)}>
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="csharp">C#</option>
                            <option value="php">PHP</option>
                            <option value="ruby">Ruby</option>
                            <option value="go">Go</option>
                            <option value="html">HTML</option>
                            <option value="css">CSS</option>
                             <option value="sql">SQL</option>
                        </Select>
                    </div>
                 </div>
            </Card>
            <Button onClick={handleExplain} disabled={isLoading || !code.trim()}>
                {isLoading ? 'Analyzing...' : 'Explain Code'}
            </Button>
            {(isLoading || explanation) && (
                <Card>
                     <h3 className="text-lg font-semibold text-white mb-2">Explanation</h3>
                     {isLoading ? (
                        <Loader text="Reading the code..." />
                     ) : (
                        <div className="prose prose-invert prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(explanation) }}></div>
                     )}
                </Card>
            )}
        </ToolContainer>
    );
};