
import React from 'react';
import { AITool, ApprovalStatus } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';

interface AdminDashboardProps {
  tools: AITool[];
  onUpdateStatus: (toolId: string, status: ApprovalStatus) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ tools, onUpdateStatus }) => {
  const pendingTools = tools.filter(tool => tool.status === ApprovalStatus.Pending);

  if (pendingTools.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-8 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-accent">Pending Submissions</h2>
      <div className="space-y-4">
        {pendingTools.map(tool => (
          <div key={tool.id} className="flex items-center justify-between bg-background p-4 rounded-md border border-gray-700">
            <div className="flex items-center gap-4">
              <img src={tool.imageBase64} alt={tool.name} className="w-16 h-16 object-cover rounded-md"/>
              <div>
                <p className="font-semibold text-text-primary">{tool.name}</p>
                <p className="text-sm text-text-secondary">Submitted by: {tool.submittedBy}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onUpdateStatus(tool.id, ApprovalStatus.Approved)}
                className="p-2 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded-full transition-colors"
                aria-label="Approve"
              >
                <CheckIcon />
              </button>
              <button 
                onClick={() => onUpdateStatus(tool.id, ApprovalStatus.Rejected)}
                className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-full transition-colors"
                aria-label="Reject"
              >
                <XIcon />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
