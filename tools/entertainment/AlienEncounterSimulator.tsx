import React from 'react';
import ToolContainer from '../common/ToolContainer';
import { generateJson, GenAiType } from '../../services/geminiService';
import { tools } from '../index';

interface AlienReportOutput {
  objectName: string;
  alienDesignation: string;
  analysis: string;
  recommendation: string;
}

export const renderAlienEncounterSimulatorOutput = (output: AlienReportOutput | string) => {
  let data: AlienReportOutput;

  if (typeof output === 'string') {
    try {
      data = JSON.parse(output);
    } catch (e) {
      return <p className="text-red-400">Failed to parse history data.</p>;
    }
  } else {
    data = output;
  }

  if (!data || !data.objectName) {
    return <p className="text-red-400">Could not generate a report. Please try another object.</p>;
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 font-mono text-green-300">
      <h2 className="text-xl font-bold text-center border-b-2 border-green-300/50 pb-2">
        [ GALACTIC FEDERATION - CLASSIFIED REPORT ]
      </h2>
      <div className="mt-4 space-y-3 text-sm">
        <p>
          <span className="text-green-500">&gt; SUBJECT:</span> {data.objectName} (Human designation)
        </p>
        <p>
          <span className="text-green-500">&gt; XENO-DESIGNATION:</span> {data.alienDesignation}
        </p>
        <p>
          <span className="text-green-500">&gt; ANALYSIS:</span>
        </p>
        <p className="pl-4 whitespace-pre-wrap">{data.analysis}</p>
        <p>
          <span className="text-green-500">&gt; RECOMMENDATION TO HIGH COUNCIL:</span>
        </p>
        <p className="pl-4">{data.recommendation}</p>
        <p className="text-center pt-4 border-t border-green-300/50">[ END REPORT ]</p>
      </div>
    </div>
  );
};

const AlienEncounterSimulator: React.FC = () => {
  const toolInfo = tools.find((t) => t.id === 'alien-encounter-simulator');

  if (!toolInfo) {
    return <p className="text-red-400">Tool info not found.</p>;
  }

  const schema = {
    type: GenAiType.OBJECT,
    properties: {
      objectName: { type: GenAiType.STRING, description: 'The human name for the object.' },
      alienDesignation: { type: GenAiType.STRING, description: 'A scientific-sounding alien name for the object.' },
      analysis: { type: GenAiType.STRING, description: "The alien's humorous misinterpretation of the object's function." },
      recommendation: { type: GenAiType.STRING, description: "A recommendation to the alien high council (e.g., 'Immediate acquisition', 'Destroy on sight')." },
    },
    required: ['objectName', 'alienDesignation', 'analysis', 'recommendation'],
  };

  const handleGenerate = async ({ prompt }: { prompt: string }) => {
    const fullPrompt = `You are an alien scientist who has just discovered an Earth object for the first time. Write a formal scientific report about it, completely misinterpreting its function in a humorous way. The object is: "${prompt}". Provide the object's human name, an alien designation for it, your analysis of its purpose, and a recommendation to the high council.`;
    return generateJson(fullPrompt, schema);
  };

  return (
    <ToolContainer
      toolId={toolInfo.id}
      toolName={toolInfo.name}
      toolCategory={toolInfo.category}
      promptSuggestion={toolInfo.promptSuggestion}
      onGenerate={handleGenerate}
      renderOutput={renderAlienEncounterSimulatorOutput}
    />
  );
};

export default AlienEncounterSimulator;
