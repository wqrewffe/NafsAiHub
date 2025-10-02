
import React, { useState, useEffect, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { getFullUserHistory } from '../../services/firebaseService';
import { HistoryItem } from '../../types';
import { tools } from '../../tools';
import Spinner from '../../components/Spinner';
import { ClipboardDocumentIcon, CheckCircleIcon, ChevronDownIcon, ChevronRightIcon, ArrowLeftIcon } from '../../tools/Icons';

const UserHistoryPage: React.FC = () => {
    const { userId } = ReactRouterDOM.useParams<{ userId: string }>();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

    const toolsById = useMemo(() => new Map(tools.map(t => [t.id, t])), []);

    useEffect(() => {
        if (!userId) return;
        
        const fetchHistory = async () => {
            try {
                const userHistory = await getFullUserHistory(userId);
                setHistory(userHistory);
            } catch (err) {
                setError('Failed to fetch user history.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [userId]);

    const CopyButton: React.FC<{ text: string, title: string }> = ({ text, title }) => {
        const [copied, setCopied] = useState(false);
        const handleCopy = (e: React.MouseEvent) => {
            e.stopPropagation();
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        };
        return (
            <button 
                onClick={handleCopy} 
                title={`Copy ${title}`}
                disabled={copied}
                className={`flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-md transition-all duration-200 transform disabled:bg-green-800/50 disabled:text-green-400 hover:scale-105 active:scale-95`}
            >
                {copied ? <CheckCircleIcon className="h-4 w-4 text-green-400" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
                {copied ? 'Copied' : `Copy ${title}`}
            </button>
        );
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <ReactRouterDOM.Link to="/admin" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-accent">
                <ArrowLeftIcon className="h-5 w-5" />
                Back to User List
            </ReactRouterDOM.Link>

            <div>
                <h1 className="text-3xl font-bold">User Tool History</h1>
                <p className="text-slate-400 mt-1 font-mono text-xs">User ID: {userId}</p>
            </div>
            
            <div className="bg-secondary p-6 rounded-lg">
                {loading ? (
                    <div className="flex justify-center py-8"><Spinner /></div>
                ) : error ? (
                    <p className="text-red-400">{error}</p>
                ) : history.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto pr-2 hide-scrollbar">
                    <ul className="space-y-2">
                        {history.map(item => {
                            const tool = toolsById.get(item.toolId);
                            return (
                                <li key={item.id} className="bg-primary rounded-md transition-all duration-300">
                                    <div 
                                        className="flex justify-between items-start cursor-pointer p-4"
                                        onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}
                                    >
                                        <div className="flex-grow pr-4">
                                            <div className="flex items-center gap-4 mb-1">
                                                <span className="font-bold text-accent">{item.toolName}</span>
                                                <span className="text-xs text-slate-500">{item.timestamp.toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm text-slate-300 whitespace-pre-wrap font-mono break-words">{item.prompt}</p>
                                        </div>
                                        <div className="flex-shrink-0 ml-4 pt-1">
                                            {expandedHistoryId === item.id ? <ChevronDownIcon className="h-5 w-5 text-slate-400"/> : <ChevronRightIcon className="h-5 w-5 text-slate-400"/>}
                                        </div>
                                    </div>
                                    {expandedHistoryId === item.id && (
                                        <div className="p-4 border-t border-slate-700">
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-sm font-semibold text-slate-300">Full Response</p>
                                                <CopyButton text={item.response} title="Response" />
                                            </div>
                                            <div className="p-4 bg-primary rounded-md border border-slate-700">
                                                {tool ? tool.renderOutput(item.response) : <pre className="whitespace-pre-wrap">{item.response}</pre>}
                                            </div>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                    </div>
                ) : (
                    <p className="text-slate-400 text-center py-4">This user has no tool usage history.</p>
                )}
            </div>
        </div>
    );
};

export default UserHistoryPage;
