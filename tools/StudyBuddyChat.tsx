
import React from 'react';
import ToolContainer, { ToolOptionConfig } from './common/ToolContainer';
import { generateText } from '../services/geminiService';
import { tools } from './index';
import { ChatBubbleLeftRightIcon } from './Icons';

// A simple component to render basic markdown
const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    const renderLine = (line: string) => {
        // Bold: **text**
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italic: *text*
        line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
        return { __html: line };
    };

    const lines = text.split('\n');
    const elements = [];
    let listItems = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const isListItem = line.startsWith('- ') || line.startsWith('* ');

        if (isListItem) {
            listItems.push(line.substring(2).trim());
        } else {
            if (listItems.length > 0) {
                elements.push(
                    <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-2 pl-4">
                        {listItems.map((item, index) => (
                            <li key={index} dangerouslySetInnerHTML={renderLine(item)} />
                        ))}
                    </ul>
                );
                listItems = [];
            }
            if (line) {
                elements.push(<p key={`p-${i}`} dangerouslySetInnerHTML={renderLine(line)} />);
            }
        }
    }
    // Add any remaining list items
    if (listItems.length > 0) {
        elements.push(
            <ul key="ul-last" className="list-disc list-inside space-y-1 my-2 pl-4">
                {listItems.map((item, index) => (
                    <li key={index} dangerouslySetInnerHTML={renderLine(item)} />
                ))}
            </ul>
        );
    }

    return <div className="space-y-3">{elements}</div>;
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

export const renderStudyBuddyChatOutput = (output: string) => {
    return (
        <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center ring-2 ring-accent/30">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-accent" />
                </div>
            </div>
            <div className="bg-primary p-4 rounded-lg rounded-tl-none min-w-0 flex-1 border border-slate-700">
                <div className="text-slate-300 font-sans leading-relaxed">
                   <MarkdownRenderer text={output} />
                </div>
            </div>
        </div>
    );
};

const StudyBuddyChat: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'study-buddy-chat')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'persona',
            label: 'AI Persona',
            type: 'select',
            defaultValue: 'Friendly Study Buddy',
            options: [
                { value: 'Friendly Study Buddy', label: 'Friendly Study Buddy' },
                { value: 'Formal Professor', label: 'Formal Professor' },
                { value: 'Enthusiastic Tutor', label: 'Enthusiastic Tutor' },
            ]
        },
        {
            name: 'responseFormat',
            label: 'Response Format',
            type: 'select',
            defaultValue: 'Paragraph',
            options: [
                { value: 'Paragraph', label: 'Paragraph' },
                { value: 'Bulleted List', label: 'Bulleted List' },
                { value: 'Q&A', label: 'Q&A' },
            ]
        },
        languageOptions
    ];

    const handleGenerate = async ({ prompt: question, options }: { prompt: string; options: any }) => {
        const { persona, language, responseFormat } = options;
        const prompt = `You are a helpful AI with the persona of a "${persona}". Answer the following question clearly and concisely, as if explaining it to a fellow student. Format the response as a '${responseFormat}'. Use markdown for formatting (like **bolding** key terms or using lists with - or *) to make the explanation clear. The entire response must be in ${language}.\n\nQuestion: "${question}"`;
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
            renderOutput={renderStudyBuddyChatOutput}
        />
    );
};

export default StudyBuddyChat;
