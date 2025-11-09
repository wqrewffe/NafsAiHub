import React from 'react';
import ToolContainer from '../common/ToolContainer';
import { generateJson, GenAiType } from '../../services/geminiService';
import { tools } from '../index';
import { ShareIcon } from '../Icons';

interface Layer {
    layer: string;
    type: string;
    neurons: number | string;
    activation: string;
}

interface NetworkOutput {
    problemType: string;
    architecture: Layer[];
    rationale: string;
}

export const renderNeuralNetworkArchitectOutput = (output: NetworkOutput | string) => {
    let data: NetworkOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.architecture) || data.architecture.length === 0) {
        return <p className="text-red-400">Could not generate an architecture. Please describe the problem more clearly.</p>;
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <ShareIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Suggested Network Architecture</h2>
                <p className="text-slate-400">For Problem: <span className="italic">"{data.problemType}"</span></p>
            </div>
            <div className="bg-primary font-mono text-sm p-4 rounded-lg flex flex-col items-center space-y-2">
                {data.architecture.map((layer, index) => (
                    <React.Fragment key={index}>
                        <div className="bg-secondary p-3 rounded-md w-full max-w-sm text-center">
                            <p className="font-bold text-accent">{layer.layer} ({layer.type})</p>
                            <p className="text-slate-300">Neurons: {layer.neurons}</p>
                            <p className="text-slate-300">Activation: {layer.activation}</p>
                        </div>
                        {index < data.architecture.length - 1 && <p className="text-accent">↓</p>}
                    </React.Fragment>
                ))}
            </div>
             <div className="bg-secondary p-4 rounded-lg">
                <h3 className="font-bold text-lg text-light">Rationale</h3>
                <p className="text-slate-300 mt-1 text-sm">{data.rationale}</p>
            </div>
        </div>
    );
};

const NeuralNetworkArchitect: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'neural-network-architect')!;

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            problemType: { type: GenAiType.STRING },
            architecture: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        layer: { type: GenAiType.STRING, description: "e.g., 'Input Layer', 'Hidden Layer 1', 'Output Layer'" },
                        type: { type: GenAiType.STRING, description: "e.g., 'Dense', 'Convolutional', 'LSTM'" },
                        neurons: { type: GenAiType.STRING, description: "Number of neurons or a descriptive string (e.g., 'Depends on input data')." },
                        activation: { type: GenAiType.STRING, description: "e.g., 'ReLU', 'Sigmoid', 'Softmax'" }
                    },
                    required: ["layer", "type", "neurons", "activation"]
                }
            },
            rationale: { type: GenAiType.STRING, description: "An explanation for the architectural choices." }
        },
        required: ["problemType", "architecture", "rationale"]
    };

    const handleGenerate = async ({ prompt }: { prompt: string; options: any }) => {
        const fullPrompt = `Act as a machine learning engineer. Based on the following problem description, design a suitable neural network architecture. Identify the problem type, define the layers (including type, neuron count, and activation function), and provide a rationale for your design choices.

        Problem: "${prompt}"`;
        return generateJson(fullPrompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            onGenerate={handleGenerate}
            renderOutput={renderNeuralNetworkArchitectOutput}
        />
    );
};

export default NeuralNetworkArchitect;
