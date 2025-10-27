import React, { useState } from 'react';
import { AITool, ApprovalStatus } from '../types';
import { ShareIcon } from './icons/ShareIcon';

interface ToolCardProps {
  tool: AITool;
  isAdmin: boolean;
  onDelete?: (toolId: string) => void;
  onEdit?: (toolId: string) => void;
}

const getStatusClasses = (status: ApprovalStatus) => {
  switch (status) {
    case ApprovalStatus.Pending:
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
    case ApprovalStatus.Approved:
      return 'bg-green-500/20 text-green-400 border-green-500';
    case ApprovalStatus.Rejected:
      return 'bg-red-500/20 text-red-400 border-red-500';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500';
  }
};

const ToolCard: React.FC<ToolCardProps> = ({ tool, isAdmin, onDelete, onEdit }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: tool.name,
      text: tool.description,
      url: tool.link,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(tool.link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy link:', error);
        alert('Could not copy link to clipboard.');
      }
    }
  };


  return (
    <div className={`bg-card rounded-lg overflow-hidden shadow-lg border border-border hover:border-accent transition-all duration-300 transform hover:-translate-y-1 flex flex-col ${tool.status === ApprovalStatus.Pending && 'border-yellow-500'}`}>
      <img className="w-full h-48 object-cover" src={tool.imageBase64} alt={tool.name} />
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-text-primary">{tool.name}</h3>
            {isAdmin && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusClasses(tool.status)}`}>
                    {tool.status}
                </span>
            )}
        </div>
        <p className="text-text-secondary text-sm mb-4 flex-grow">{tool.description}</p>
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {tool.keywords.map((keyword, index) => (
              <span key={index} className="bg-gray-700 text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full">
                {keyword}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-auto flex items-center gap-3">
          <a
            href={tool.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-grow text-center bg-accent hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
          >
            Visit Tool
          </a>
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={() => onEdit && onEdit(tool.id)}
                className="p-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded transition-colors duration-200"
                aria-label="Edit tool"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete && onDelete(tool.id)}
                className="p-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors duration-200"
                aria-label="Delete tool"
              >
                Delete
              </button>
            </div>
          )}
          <button
            onClick={handleShare}
            className="relative p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors duration-300 shrink-0"
            aria-label="Share tool"
          >
            <ShareIcon />
            {copied && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-background border border-border text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
                Link Copied!
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolCard;