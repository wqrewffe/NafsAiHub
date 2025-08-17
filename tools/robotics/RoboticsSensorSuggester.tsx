import React from 'react';
import ToolContainer from '../common/ToolContainer';
import { generateJson, GenAiType } from '../../services/geminiService';
import { tools } from '../index';
import { EyeIcon } from '../Icons';

interface SensorSuggestion {
    type: string;
    use: string;
    justification: string;
}

interface SensorOutput {
    task: string;
    sensors: SensorSuggestion[];
}

export const renderRoboticsSensorSuggesterOutput = (output: SensorOutput | string) => {
    let data: SensorOutput;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            return <p className="text-red-400">Failed to parse history data.</p>;
        }
    } else {
        data = output;
    }

    if (!data || !Array.isArray(data.sensors) || data.sensors.length === 0) {
        return <p className="text-red-400">Could not suggest sensors. Please describe the robot's task more clearly.</p>;
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <EyeIcon className="h-10 w-10 mx-auto text-accent mb-2" />
                <h2 className="text-2xl font-bold text-light">Sensor Suite Recommendation</h2>
                <p className="text-slate-400">For Task: <span className="italic">"{data.task}"</span></p>
            </div>
            <div className="border border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full divide-y divide-slate-700">
                    <thead className="bg-secondary">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider w-1/4">Sensor Type</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Primary Use</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Justification</th>
                        </tr>
                    </thead>
                    <tbody className="bg-primary divide-y divide-slate-700">
                        {data.sensors.map((sensor, index) => (
                            <tr key={index}>
                                <td className="px-4 py-4 font-bold text-accent align-top">{sensor.type}</td>
                                <td className="px-4 py-4 text-light align-top">{sensor.use}</td>
                                <td className="px-4 py-4 text-slate-400 text-sm align-top">{sensor.justification}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const RoboticsSensorSuggester: React.FC = () => {
    const toolInfo = tools.find(t => t.id === 'robotics-sensor-suggester')!;

    const schema = {
        type: GenAiType.OBJECT,
        properties: {
            task: { type: GenAiType.STRING },
            sensors: {
                type: GenAiType.ARRAY,
                items: {
                    type: GenAiType.OBJECT,
                    properties: {
                        type: { type: GenAiType.STRING, description: "e.g., 'LiDAR', 'IMU (Inertial Measurement Unit)'" },
                        use: { type: GenAiType.STRING, description: "e.g., 'Obstacle detection and mapping'" },
                        justification: { type: GenAiType.STRING, description: "Why this sensor is appropriate for the task." }
                    },
                    required: ["type", "use", "justification"]
                }
            }
        },
        required: ["task", "sensors"]
    };

    const handleGenerate = async ({ prompt }: { prompt: string; options: any }) => {
        const fullPrompt = `Based on the following description of a robot's task and environment, suggest a suite of 3-4 appropriate sensors. For each sensor, provide its type, primary use case for this task, and a justification for its inclusion.

        Robot's Task: "${prompt}"`;
        return generateJson(fullPrompt, schema);
    };

    return (
        <ToolContainer
            toolId={toolInfo.id}
            toolName={toolInfo.name}
            toolCategory={toolInfo.category}
            promptSuggestion={toolInfo.promptSuggestion}
            onGenerate={handleGenerate}
            renderOutput={renderRoboticsSensorSuggesterOutput}
        />
    );
};

export default RoboticsSensorSuggester;
