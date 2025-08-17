import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tools } from '../tools';
import { useAuth } from '../hooks/useAuth';
import { onToolHistorySnapshot } from '../services/firebaseService';
import { HistoryItem } from '../types';
import Spinner from '../components/Spinner';
import { ClipboardDocumentIcon, CheckCircleIcon, ChevronDownIcon, ChevronRightIcon } from '../tools/Icons';

const ToolPage: React.FC = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const tool = tools.find(t => t.id === toolId);

  const { currentUser } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && toolId) {
      setHistoryLoading(true);
      const unsubscribe = onToolHistorySnapshot(
        currentUser.uid,
        toolId,
        (userHistory) => {
          setHistory(userHistory);
          setHistoryLoading(false);
        }
      );
      // Clean up the listener when the component unmounts or dependencies change
      return () => unsubscribe();
    } else {
      // Not logged in or no toolId, so clear history
      setHistory([]);
      setHistoryLoading(false);
    }
  }, [currentUser, toolId]);

  if (!tool || !tool.component || !tool.renderOutput) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-400">Tool not found</h2>
        <p className="mt-4 text-slate-300">The tool you are looking for does not exist or has a dedicated page.</p>
        <Link to="/" className="mt-6 inline-block bg-accent text-white font-bold py-2 px-4 rounded hover:bg-sky-400 btn-animated">
          Back to Home
        </Link>
      </div>
    );
  }

  const ToolComponent = tool.component;
  
  const CopyButton: React.FC<{ text: string, title: string }> = ({ text, title }) => {
    const [copied, setCopied] = useState(false);
    const [clicked, setClicked] = useState(false);
    
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation(); // prevent accordion from toggling
        navigator.clipboard.writeText(text);
        setCopied(true);
        setClicked(true);
        setTimeout(() => setClicked(false), 300);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button 
            onClick={handleCopy} 
            title={`Copy ${title}`}
            disabled={copied}
            className={`flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-md transition-all duration-200 transform disabled:bg-green-800/50 disabled:text-green-400 ${clicked ? 'animate-pop' : ''} hover:scale-105 active:scale-95`}
        >
            {copied ? <CheckCircleIcon className="h-4 w-4 text-green-400" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
            {copied ? 'Copied' : `Copy ${title}`}
        </button>
    );
  };

  return (
    <div>
      <div className="mb-8 p-6 bg-secondary rounded-lg">
        <div className="flex flex-col text-center sm:text-left sm:flex-row sm:items-center">
          <tool.icon className="h-10 w-10 text-accent mx-auto mb-4 sm:mb-0 sm:mr-4 flex-shrink-0"/>
          <div>
            <h1 className="text-3xl font-bold text-light">{tool.name}</h1>
            <p className="text-slate-400">{tool.description}</p>
          </div>
        </div>
      </div>
      <div className="bg-secondary p-6 rounded-lg mb-8">
        <ToolComponent />
      </div>

      <div className="bg-secondary p-6 rounded-lg">
        <button
          onClick={() => setIsHistoryVisible(!isHistoryVisible)}
          className="w-full flex justify-between items-center text-left text-xl font-bold text-light"
          aria-expanded={isHistoryVisible}
        >
          <span>Tool History</span>
          {isHistoryVisible ? <ChevronDownIcon className="h-6 w-6"/> : <ChevronRightIcon className="h-6 w-6"/>}
        </button>
        
        <div className={`accordion-content ${isHistoryVisible ? 'open' : ''}`}>
          <div className="mt-4">
            {historyLoading ? (
              <div className="flex justify-center items-center py-8"><Spinner /></div>
            ) : history.length > 0 ? (
              <ul className="space-y-2">
                {history.map(item => (
                  <li key={item.id} className="bg-primary rounded-md animate-fade-in transition-all duration-300">
                    <div 
                      className="flex justify-between items-start cursor-pointer p-4"
                      onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}
                      aria-expanded={expandedHistoryId === item.id}
                      aria-controls={`response-${item.id}`}
                      role="button"
                    >
                      <div className="flex-grow pr-4">
                          <p className="text-xs text-slate-500 mb-1">{item.timestamp.toLocaleString()}</p>
                          <p className="text-sm text-slate-300 whitespace-pre-wrap font-mono break-words">{item.prompt}</p>
                      </div>
                      <div className="flex-shrink-0 ml-4 pt-1">
                          {expandedHistoryId === item.id ? <ChevronDownIcon className="h-5 w-5 text-slate-400"/> : <ChevronRightIcon className="h-5 w-5 text-slate-400"/>}
                      </div>
                    </div>
                    
                    {expandedHistoryId === item.id && (
                      <div className="p-4 border-t border-slate-700" id={`response-${item.id}`}>
                          <div className="flex justify-between items-center mb-2">
                              <p className="text-sm font-semibold text-slate-300">Full Response</p>
                              <CopyButton text={item.response} title="Response" />
                          </div>
                          <div className="p-4 bg-primary rounded-md border border-slate-700 overflow-x-auto">
                            {tool.renderOutput(item.response)}
                          </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 text-center py-4">You haven't used this tool yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolPage;
