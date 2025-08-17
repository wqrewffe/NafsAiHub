
import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { logToolUsage } from '../../services/firebaseService';
import Spinner from '../../components/Spinner';

export interface ToolOptionConfig {
  name: string;
  label: string;
  type: 'select' | 'number' | 'text';
  defaultValue: string | number;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  placeholder?: string;
}

interface ToolContainerProps {
  toolId: string;
  toolName: string;
  toolCategory: string;
  promptSuggestion?: string;
  optionsConfig?: ToolOptionConfig[];
  onGenerate: (data: { prompt: string; options: Record<string, any> }) => Promise<string | object>;
  renderOutput: (output: any) => React.ReactNode;
}

const ToolContainer: React.FC<ToolContainerProps> = ({ toolId, toolName, toolCategory, promptSuggestion, optionsConfig = [], onGenerate, renderOutput }) => {
  const [prompt, setPrompt] = useState(promptSuggestion || '');
  const [output, setOutput] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  const initialOptions = useMemo(() => {
    const state: Record<string, any> = {};
    optionsConfig.forEach(opt => {
        state[opt.name] = opt.defaultValue;
    });
    return state;
  }, [optionsConfig]);

  const [options, setOptions] = useState(initialOptions);

  const handleOptionChange = (name: string, value: string | number) => {
    setOptions(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Input cannot be empty.');
      return;
    }
    setError('');
    setLoading(true);
    setOutput(null);

    try {
      const result = await onGenerate({ prompt, options });
      setOutput(result);
      if (currentUser) {
        await logToolUsage(
          currentUser.uid,
          { id: toolId, name: toolName, category: toolCategory },
          prompt,
          typeof result === 'string' ? result : JSON.stringify(result, null, 2)
        );
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [prompt, options, currentUser, toolId, toolName, toolCategory, onGenerate]);

  const renderOptionControl = (opt: ToolOptionConfig) => {
    switch (opt.type) {
        case 'select':
            return (
                <select
                    id={opt.name}
                    name={opt.name}
                    value={options[opt.name]}
                    onChange={(e) => handleOptionChange(opt.name, e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-primary border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
                >
                    {opt.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            );
        case 'number':
            return (
                <input
                    type="number"
                    id={opt.name}
                    name={opt.name}
                    value={options[opt.name]}
                    onChange={(e) => handleOptionChange(opt.name, parseInt(e.target.value, 10))}
                    min={opt.min}
                    max={opt.max}
                    className="w-full mt-1 px-3 py-2 bg-primary border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
                />
            );
        case 'text':
             return (
                <input
                    type="text"
                    id={opt.name}
                    name={opt.name}
                    value={options[opt.name]}
                    onChange={(e) => handleOptionChange(opt.name, e.target.value)}
                    placeholder={opt.placeholder || ''}
                    className="w-full mt-1 px-3 py-2 bg-primary border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
                />
            );
        default:
            return null;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="prompt-textarea" className="block text-sm font-medium text-slate-300 mb-2">
          Your Input
        </label>
        <textarea
          id="prompt-textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={promptSuggestion ? `e.g., ${promptSuggestion}` : "Enter your input here..."}
          rows={5}
          className="w-full p-3 bg-primary border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent"
          disabled={loading}
        />
      </div>

       {optionsConfig.length > 0 && (
          <div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-primary/50 border border-slate-700 rounded-md">
                  {optionsConfig.map(opt => (
                      <div key={opt.name}>
                          <label htmlFor={opt.name} className="block text-sm font-medium text-slate-400">{opt.label}</label>
                          {renderOptionControl(opt)}
                      </div>
                  ))}
              </div>
          </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-md font-medium text-white bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:bg-slate-500 disabled:cursor-not-allowed btn-animated btn-pulse"
      >
        {loading ? <Spinner /> : 'Generate'}
      </button>

      {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-md">{error}</div>}

      {output && (
        <div className="mt-4">
          <h3 className="text-xl font-bold text-light mb-2">Result</h3>
          <div className="p-4 bg-primary rounded-md border border-slate-700">
            {renderOutput(output)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolContainer;
