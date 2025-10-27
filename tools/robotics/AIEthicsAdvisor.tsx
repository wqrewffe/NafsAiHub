import React from 'react';
import ToolContainer from '../common/ToolContainer';
import { generateJson, GenAiType } from '../../services/geminiService';
import { tools } from '../index';
import { ShieldCheckIcon } from '../Icons';

interface EthicalRisk {
    area: string;
    riskLevel: 'Low' | 'Medium' | 'High';
    explanation: string;
    mitigation: string;
}

interface EthicsOutput {
    application: string;
    risks: EthicalRisk[];
}

export const renderAIEthicsAdvisorOutput = (output: EthicsOutput | string) => {
    let data: EthicsOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.application || !Array.isArray(data.risks)) {
        return <p className="text-red-400">Could not generate an ethical analysis. Please describe your application more clearly.</p>;
    }

    const getRiskClass = (riskLevel: string) => {
        switch (riskLevel) {
            case 'High': return 'border-red-500 bg-red-500/10';
            case 'Medium': return 'border-yellow-500 bg-yellow-500/10';
            case 'Low': return 'border-green-500 bg-green-500/10';
            default: return 'border-slate-600';
        }
    };
    
    const getRiskTextClass = (riskLevel: string) => {
        switch (riskLevel) {
            case 'High': return 'text-red-400';
            case 'Medium': return 'text-yellow-400';
            case 'Low': return 'text-green-400';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <ShieldCheckIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">AI Ethics Report Card</h2>
                <p className="text-slate-400">Application: <span className="italic">"{data.application}"</span></p>
            </div>
            <div className="space-y-4">
                {data.risks.map((risk, index) => (
                    <div key={index} className={`p-4 rounded-lg border-l-4 ${getRiskClass(risk.riskLevel)}`}>
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-light">{risk.area}</h3>
                            <span className={`font-bold text-sm px-2 py-1 rounded-md ${getRiskClass(risk.riskLevel)} ${getRiskTextClass(risk.riskLevel)}`}>{risk.riskLevel} Risk</span>
                        </div>
                        <p className="text-slate-300 mt-2">{risk.explanation}</p>
                        <div className="mt-3 pt-3 border-t border-slate-700">
                            <h4 className="font-semibold text-accent text-sm">Suggested Mitigation:</h4>
                            <p className="text-slate-400 text-sm">{risk.mitigation}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AIEthicsAdvisor: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'ai-ethics-advisor')!;

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            application: { type: GenAiType.STRING, description: "A brief summary of the AI application being analyzed." },
            risks: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        area: { type: GenAiType.STRING, description: "The ethical area of concern (e.g., 'Data Bias', 'User Privacy', 'Transparency')." },
                        riskLevel: { type: GenAiType.STRING, enum: ["Low", "Medium", "High"] },
                        explanation: { type: GenAiType.STRING, description: "Why this is a potential risk for the application." },
                        mitigation: { type: GenAiType.STRING, description: "A concrete suggestion to help mitigate this risk." }
                    },
                    required: ["area", "riskLevel", "explanation", "mitigation"]
                }
            }
        },
        required: ["application", "risks"]
    };

    const handleGenerate = async ({ prompt }: { prompt: string; options: any }) => {
        const fullPrompt = `Analyze the following AI application concept for potential ethical issues. Identify the application, then for at least 4 key ethical areas (such as Bias, Privacy, Transparency, Accountability, Fairness), assess the risk level (Low, Medium, or High), explain the potential problem, and suggest a mitigation strategy.

        AI Application: "${prompt}"`;
        return generateJson(fullPrompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            onGenerate={handleGenerate}
            renderOutput={renderAIEthicsAdvisorOutput}
        />
    );
};

export default AIEthicsAdvisor;
