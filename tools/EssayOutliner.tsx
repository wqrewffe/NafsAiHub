
import React, { useState, useEffect } from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateText } from '../services/geminiService';
import { tools } from './index';
import { ChevronDownIcon, ChevronRightIcon } from './Icons';

interface OutlineNode {
    content: string;
    level: number;
    children: OutlineNode[];
}

const languageOptions: ToolOptionConfig = {
    name: 'language',
    label: 'Output Language',
    type: 'select',
    defaultValue: 'English',
    options: [
        { value: 'English', label: 'English' },
        { value: 'Spanish', label: 'Spanish' },
        { value: 'French', label: 'French' },
        { value: 'German', label: 'German' },
        { value: 'Japanese', label: 'Japanese' },
        { value: 'Mandarin Chinese', label: 'Mandarin Chinese' },
        { value: 'Hindi', label: 'Hindi' },
        { value: 'Arabic', label: 'Arabic' },
        { value: 'Portuguese', label: 'Portuguese' },
        { value: 'Bengali', label: 'Bengali (Bangla)' },
        { value: 'Russian', label: 'Russian' },
    ]
};

const parseOutline = (text: string): OutlineNode[] => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const root: OutlineNode = { content: 'root', level: -1, children: [] };
    const path: OutlineNode[] = [root];

    lines.forEach(line => {
        const trimmedLine = line.trim();
        const indentLevel = line.match(/^\s*/)?.[0].length || 0;
        let level = 0;
        let content = trimmedLine;

        if (trimmedLine.startsWith('# ')) { level = 0; content = trimmedLine.substring(2); } 
        else if (trimmedLine.startsWith('## ')) { level = 1; content = trimmedLine.substring(3); } 
        else if (trimmedLine.startsWith('### ')) { level = 2; content = trimmedLine.substring(4); } 
        else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
            level = 3 + Math.floor(indentLevel / 2); // Simple indentation level
            content = trimmedLine.substring(2);
        } else {
            // A paragraph that belongs to the previous item
            if(path.length > 1) {
                 path[path.length - 1].content += `\n${trimmedLine}`;
            }
            return;
        }

        const node: OutlineNode = { content, level, children: [] };

        while (path.length > 1 && path[path.length - 1].level >= level) {
            path.pop();
        }

        path[path.length - 1].children.push(node);
        path.push(node);
    });

    return root.children;
};

const OutlineNodeComponent: React.FC<{ node: OutlineNode, isInitiallyOpen: boolean }> = ({ node, isInitiallyOpen }) => {
    const [isOpen, setIsOpen] = useState(isInitiallyOpen);
    const hasChildren = node.children.length > 0;

    const toggleOpen = () => setIsOpen(!isOpen);

    const getTextStyle = (level: number) => {
        switch (level) {
            case 0: return "text-2xl font-bold text-accent mb-2 pb-2";
            case 1: return "text-xl font-bold text-light mt-4";
            case 2: return "text-lg font-semibold text-sky-300 mt-2";
            default: return "text-slate-300";
        }
    };
    
    const renderContent = (content: string) => {
        return content.split('\n').map((line, i) => <p key={i}>{line}</p>);
    }

    return (
        <div className={node.level > 0 ? 'ml-6 border-l border-slate-700 pl-4' : ''}>
            <div className={`flex items-center ${hasChildren ? 'cursor-pointer' : ''}`} onClick={hasChildren ? toggleOpen : undefined}>
                {hasChildren && (
                    isOpen 
                        ? <ChevronDownIcon className="h-5 w-5 text-slate-500 mr-2 flex-shrink-0" /> 
                        : <ChevronRightIcon className="h-5 w-5 text-slate-500 mr-2 flex-shrink-0" />
                )}
                {!hasChildren && node.level >=3 && (
                     <span className="text-accent mr-3 mt-1 flex-shrink-0">●</span>
                )}
                <div className={`${getTextStyle(node.level)} ${!hasChildren && 'ml-7'}`}>{renderContent(node.content)}</div>
            </div>
            {isOpen && hasChildren && (
                <div className="mt-2">
                    {node.children.map((child, index) => (
                        <OutlineNodeComponent key={index} node={child} isInitiallyOpen={true} />
                    ))}
                </div>
            )}
        </div>
    );
};

export const OutlineRenderer = ({ content }: { content: string }) => {
    const [tree, setTree] = useState<OutlineNode[]>([]);

    useEffect(() => {
        setTree(parseOutline(content));
    }, [content]);
    
    if (tree.length === 0) {
        return <p>Generating outline...</p>;
    }

    return (
        <div className="space-y-3 text-slate-300 font-sans">
            {tree.map((node, index) => (
                <OutlineNodeComponent key={index} node={node} isInitiallyOpen={true} />
            ))}
        </div>
    );
};

export const renderEssayOutlinerOutput = (output: string) => {
    return <OutlineRenderer content={output} />;
};


const EssayOutliner: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'essay-outliner')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'style',
            label: 'Outline Style',
            type: 'select',
            defaultValue: 'Standard Markdown',
            options: [
                { value: 'Standard Markdown', label: 'Standard (Headings & Bullets)' },
                { value: 'Roman Numerals', label: 'Roman Numerals' },
                { value: 'Detailed Paragraphs', label: 'Detailed Paragraphs' },
            ]
        },
        {
            name: 'numPoints',
            label: 'Number of Body Sections',
            type: 'number',
            defaultValue: 3,
            min: 2,
            max: 5,
        },
        {
            name: 'detailLevel',
            label: 'Detail Level',
            type: 'select',
            defaultValue: 'Standard',
            options: [
                { value: 'Brief', label: 'Brief' },
                { value: 'Standard', label: 'Standard' },
                { value: 'In-depth', label: 'In-depth' },
            ]
        },
        {
            name: 'tone',
            label: 'Tone',
            type: 'select',
            defaultValue: 'Academic',
            options: [
                { value: 'Academic', label: 'Academic' },
                { value: 'Persuasive', label: 'Persuasive' },
                { value: 'Informative', label: 'Informative' },
            ]
        },
        languageOptions
    ];

    const handleGenerate = async ({ prompt: topic, options }: { prompt: string, options: any }) => {
        const { style, numPoints, language, detailLevel, tone } = options;
        const prompt = `Create a detailed, well-structured essay outline for the topic: "${topic}".
        The outline should contain an introduction, ${numPoints} main body sections, and a conclusion.
        The level of detail for each point should be '${detailLevel}'.
        The overall tone of the outline should be '${tone}'.
        Format the outline using the "${style}" style.
        The entire response must be in ${language}.`;
        return generateText(prompt);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            optionsConfig={optionsConfig}
            onGenerate={handleGenerate}
            renderOutput={renderEssayOutlinerOutput}
        />
    );
};

export default EssayOutliner;
