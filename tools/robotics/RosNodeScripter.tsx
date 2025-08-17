import React, { useState } from 'react';
import ToolContainer, { ToolOptionConfig } from '../common/ToolContainer';
import { generateJson, GenAiType } from '../../services/geminiService';
import { tools } from '../index';
import { CodeBracketIcon, ClipboardDocumentIcon, CheckCircleIcon } from '../Icons';

export interface RosNodeOutput {
    nodeName: string;
    nodeType: 'Publisher' | 'Subscriber';
    topic: string;
    messageType: string;
    code: string;
}

// React component to display the ROS node code and handle copy
const RosNodeOutputViewer: React.FC<{ output: RosNodeOutput | string }> = ({ output }) => {
    const [copied, setCopied] = useState(false);

    let data: RosNodeOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.code) {
        return <p className="text-red-400">Could not generate ROS node code.</p>;
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(data.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-4">
            <div className="bg-slate-900 rounded-t-md px-4 py-2 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-300">
                    ROS Node: <span className="font-mono text-accent">{data.nodeName}.py</span>
                </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
                >
                    {copied ? <CheckCircleIcon className="h-5 w-5 text-green-400" /> : <ClipboardDocumentIcon className="h-5 w-5" />}
                    {copied ? 'Copied!' : 'Copy Code'}
                </button>
            </div>
            <pre className="bg-primary p-4 rounded-b-md text-cyan-300 overflow-x-auto font-mono text-sm">
                <code>{data.code}</code>
            </pre>
        </div>
    );
};

// Legacy export function for backward compatibility
export const renderRosNodeScripterOutput = (output: RosNodeOutput | string) => <RosNodeOutputViewer output={output} />;

// Main Tool Component
const RosNodeScripter: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'ros-node-scripter')!;

    const optionsConfig: ToolOptionConfig[] = [
        {
            name: 'rosVersion',
            label: 'ROS Version',
            type: 'select',
            defaultValue: 'ROS 2 (Humble)',
            options: [
                { value: 'ROS 2 (Humble)', label: 'ROS 2 (Humble)' },
                { value: 'ROS 1 (Noetic)', label: 'ROS 1 (Noetic)' },
            ]
        }
    ];

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            nodeName: { type: GenAiType.STRING },
            nodeType: { type: GenAiType.STRING, enum: ["Publisher", "Subscriber"] },
            topic: { type: GenAiType.STRING },
            messageType: { type: GenAiType.STRING, description: "e.g., 'std_msgs.msg.String'" },
            code: { type: GenAiType.STRING, description: "The complete, commented Python code for the ROS node." },
        },
        required: ["nodeName", "nodeType", "topic", "messageType", "code"]
    };

    const handleGenerate = async ({ prompt, options }: { prompt: string; options: any }) => {
        const { rosVersion } = options;
        const fullPrompt = `Generate a complete, simple, and well-commented boilerplate Python script for a ${rosVersion} node based on the following request. The script should be ready to run. Identify the desired node name, type (publisher or subscriber), topic, and message type from the prompt.

Request: "${prompt}"`;
        return generateJson(fullPrompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            optionsConfig={optionsConfig}
            onGenerate={handleGenerate}
            renderOutput={(output) => <RosNodeOutputViewer output={output} />}
        />
    );
};

export default RosNodeScripter;
