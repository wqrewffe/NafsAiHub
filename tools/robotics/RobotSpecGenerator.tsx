import React from 'react';
import ToolContainer from '../common/ToolContainer';
import { generateJson, GenAiType } from '../../services/geminiService';
import { tools } from '../index';
import { Cog6ToothIcon } from '../Icons';

interface RobotSpec {
    name: string;
    primaryFunction: string;
    dimensions: string;
    weight: string;
    powerSource: string;
    locomotion: string;
    sensors: string[];
    actuators: string[];
    processingUnit: string;
}

const SpecRow: React.FC<{ label: string; value: string | string[] }> = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 border-t border-slate-700 py-3">
        <dt className="text-sm font-medium text-slate-400">{label}</dt>
        <dd className="col-span-2 text-sm text-light">
            {Array.isArray(value) ? (
                <ul className="list-disc list-inside">
                    {value.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            ) : (
                value
            )}
        </dd>
    </div>
);

export const renderRobotSpecGeneratorOutput = (output: RobotSpec | string) => {
    let data: RobotSpec;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !data.name || !data.primaryFunction) {
        return <p className="text-red-400">Could not generate specifications. Please describe the robot's purpose more clearly.</p>;
    }

    return (
        <div className="bg-secondary p-6 rounded-lg border border-slate-700">
            <div className="text-center mb-4">
                <Cog6ToothIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">{data.name}</h2>
                <p className="text-sm text-slate-400">Technical Specification Sheet</p>
            </div>
            <dl>
                <SpecRow label="Primary Function" value={data.primaryFunction} />
                <SpecRow label="Dimensions (Approx.)" value={data.dimensions} />
                <SpecRow label="Est. Weight" value={data.weight} />
                <SpecRow label="Power Source" value={data.powerSource} />
                <SpecRow label="Locomotion" value={data.locomotion} />
                <SpecRow label="Key Sensors" value={data.sensors} />
                <SpecRow label="Actuators" value={data.actuators} />
                <SpecRow label="Processing Unit" value={data.processingUnit} />
            </dl>
        </div>
    );
};

const RobotSpecGenerator: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'robot-spec-generator')!;

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            name: { type: GenAiType.STRING, description: "A plausible, technical-sounding name for the robot." },
            primaryFunction: { type: GenAiType.STRING },
            dimensions: { type: GenAiType.STRING, description: "e.g., '30cm x 30cm x 15cm'" },
            weight: { type: GenAiType.STRING, description: "e.g., '5 kg'" },
            powerSource: { type: GenAiType.STRING, description: "e.g., 'Rechargeable Li-ion Battery (24V)'" },
            locomotion: { type: GenAiType.STRING, description: "e.g., '4-wheel differential drive'" },
            sensors: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "A list of 3-5 key sensors." },
            actuators: { type: GenAiType.ARRAY, items: { type: GenAiType.STRING }, description: "A list of 2-3 actuators." },
            processingUnit: { type: GenAiType.STRING, description: "e.g., 'Raspberry Pi 4 with NVIDIA Jetson Nano'" },
        },
        required: ["name", "primaryFunction", "dimensions", "weight", "powerSource", "locomotion", "sensors", "actuators", "processingUnit"]
    };

    const handleGenerate = async ({ prompt }: { prompt: string; options: any }) => {
        const fullPrompt = `Based on the following high-level description of a robot, generate a detailed technical specification sheet. Fill in all fields with plausible, realistic data.

        Robot Concept: "${prompt}"`;
        return generateJson(fullPrompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            onGenerate={handleGenerate}
            renderOutput={renderRobotSpecGeneratorOutput}
        />
    );
};

export default RobotSpecGenerator;
