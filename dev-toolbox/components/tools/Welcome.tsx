import React, { useEffect, useState } from 'react';
import { ALL_TOOLS } from '../../constants';
import { ToolHeader } from '../common/ToolHeader';
import { Card } from '../common/Card';
import { ToolContainer } from '../common/ToolContainer';
import { getTopUsedToolsGlobalByRange } from '../../../services/firebaseService';

type Range = 'today' | 'week' | 'month' | 'year' | 'all';

export const Welcome: React.FC = () => {
  const [range, setRange] = useState<Range>('today');
  const [topTools, setTopTools] = useState<Array<{ toolId: string; toolName: string; count: number }>>([]);

  useEffect(() => {
    let mounted = true;
    const allowedIds = ALL_TOOLS.map(t => t.id);
    getTopUsedToolsGlobalByRange(range, 7, allowedIds).then(res => {
      if (mounted) setTopTools(res as any);
    }).catch(err => {
      console.warn('Could not load top tools by range', err);
    });
    return () => { mounted = false; };
  }, [range]);

  return (
    <ToolContainer>
      <div>
      <ToolHeader 
        title="Welcome to Dev Toolbox"
        description="Your all-in-one suite of utilities for development, design, and more."
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="flex items-center space-x-4">
            <div className="bg-indigo-500/10 p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-indigo-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3h16.5M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3h16.5m-16.5 0h16.5v11.25A2.25 2.25 0 0118 16.5h-12A2.25 2.25 0 013.75 14.25V3z" />
                </svg>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-bold text-white">{ALL_TOOLS.length}</p>
              <p className="text-slate-400">Powerful Tools</p>
            </div>
        </Card>
        <Card className="flex items-center space-x-4">
            <div className="bg-emerald-500/10 p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-emerald-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-bold text-white">100%</p>
              <p className="text-slate-400">Free & Open</p>
            </div>
        </Card>
      </div>

     <div className="mt-12">
      <h2 className="text-2xl font-bold text-white mb-4">Getting Started</h2>
      <p className="text-slate-400 text-lg">
        Select a tool from the sidebar on the left to begin. The tools are organized by category to help you find what you need quickly.
        Whether you're manipulating text, generating favicons, or converting colors, this toolbox has you covered.
      </p>
    </div>

    <div className="mt-8">
      <h3 className="text-xl font-semibold text-white mb-2">Top used tools</h3>
      <div className="flex items-center gap-2 mb-4">
        <select value={range} onChange={e => setRange(e.target.value as Range)} className="bg-slate-800 text-white p-2 rounded">
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="all">All time</option>
        </select>
        <span className="text-slate-400">Showing top tools by usage for the selected range.</span>
      </div>

      <div className="grid gap-2">
        {topTools.length === 0 ? (
          <Card className="p-4 text-slate-400">No usage data for this period yet.</Card>
        ) : (
          topTools.map((t, i) => (
            <Card key={t.toolId} className="p-3 flex justify-between items-center">
              <div>
                <div className="text-white font-medium">{t.toolName || t.toolId}</div>
                <div className="text-slate-400 text-sm">{t.toolId}</div>
              </div>
              <div className="text-white font-bold">{t.count}</div>
            </Card>
          ))
        )}
      </div>
    </div>
    </div>
  </ToolContainer>
  );
};