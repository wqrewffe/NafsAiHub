import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { logToolUsage } from '../../services/firebaseService';
import { toolAccessService, ToolAccess } from '../../services/toolAccessService';
import { useCongratulations } from '../../hooks/CongratulationsProvider';
import { tools } from '../index';
import Spinner from '../../components/Spinner';
import type { ToolOptionConfig, ImageFile } from '../../types';
import { PaperClipIcon, XCircleIcon } from '../Icons';

// Re-exporting this type to make it available to other modules importing ToolContainer
export type { ToolOptionConfig };

interface ToolContainerProps {
  toolId: string;
  toolName: string;
  toolCategory: string;
  promptSuggestion?: string;
  optionsConfig?: ToolOptionConfig[];
  onGenerate: (data: { prompt: string; options: Record<string, any>, image?: { mimeType: string, data: string } }) => Promise<string | object>;
  renderOutput: (output: any, onUpdateOutput?: (output: any) => void) => React.ReactNode;
}

const ToolContainer: React.FC<ToolContainerProps> = ({ toolId, toolName, toolCategory, promptSuggestion, optionsConfig = [], onGenerate, renderOutput }) => {
  const [prompt, setPrompt] = useState(promptSuggestion || '');
  const [output, setOutput] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [image, setImage] = useState<ImageFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();
  const { checkForAchievements, showCongratulations } = useCongratulations();

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
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/') && file.size < 5 * 1024 * 1024) { // 5MB limit
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            const base64 = (loadEvent.target?.result as string).split(',')[1];
            setImage({
                name: file.name,
                type: file.type,
                base64,
            });
        };
        reader.readAsDataURL(file);
    } else if (file) {
        setError("Please select an image file under 5MB.");
    }
    if (e.target) e.target.value = '';
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() && !image) {
      setError('Input or an image is required.');
      return;
    }
    setError('');
    setLoading(true);
    setOutput(null);

    try {
      const result = await onGenerate({ prompt, options, image: image ? { mimeType: image.type, data: image.base64 } : undefined });
      setOutput(result);
      if (currentUser) {
        console.log('[DEBUG] Recording tool usage and unlocking progress');
        
        // Record the tool usage in history
        await logToolUsage(
          currentUser.uid,
          { id: toolId, name: toolName, category: toolCategory },
          prompt,
          typeof result === 'string' ? result : JSON.stringify(result, null, 2)
        );
        
        // Record the tool use for unlocking progress
        const { unlockedToolId, currentProgress } = await toolAccessService.recordToolUse(currentUser.uid, toolId);
        
        console.log('[DEBUG] Tool usage recorded:', {
          toolId,
          currentProgress,
          unlockedToolId: unlockedToolId || 'none'
        });

        if (unlockedToolId) {
          // Show congratulations modal immediately for the unlocked tool
          const unlockedTool = tools.find(t => t.id === unlockedToolId);
          checkForAchievements(); // This will trigger the notification
          if (unlockedTool) {
            showCongratulations('success', {
              title: '🎁 New Tool Unlocked!',
              message: `You've unlocked ${unlockedTool.name}!`,
              toolId: unlockedToolId,
              redirectTo: `/tool/${unlockedToolId}`
            });
          }
        } else {
          // Check for other achievements after a delay
          setTimeout(() => {
            checkForAchievements();
          }, 1000);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [prompt, options, currentUser, toolId, toolName, toolCategory, onGenerate, image]);

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
        <div className="relative">
             <textarea
              id="prompt-textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={promptSuggestion ? `e.g., ${promptSuggestion}` : "Enter your input here, or use the attachment button..."}
              rows={5}
              className="w-full p-3 pr-12 bg-primary border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent"
              disabled={loading}
            />
            <div className="absolute bottom-2 right-2">
                 <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" ref={fileInputRef} onChange={handleImageUpload} className="hidden" aria-label="Upload an image" />
                <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={loading || !!image}
                    className="p-2 rounded-full bg-slate-700 text-slate-300 hover:bg-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Attach Image"
                >
                    <PaperClipIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
        {image && (
            <div className="mt-2 p-2 bg-primary/50 border border-slate-700 rounded-md">
                <p className="text-xs text-slate-400 mb-1">Image Attached:</p>
                <div className="relative group w-32">
                    <img src={`data:${image.type};base64,${image.base64}`} alt={image.name} className="rounded-md object-cover h-20 w-32" />
                    <button onClick={() => setImage(null)} className="absolute top-0 right-0 -m-1 p-0.5 bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity" title="Remove image">
                        <XCircleIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        )}
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