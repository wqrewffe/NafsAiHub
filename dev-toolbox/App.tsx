import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ALL_TOOLS, TOOL_MAP } from './constants';
import { Tool } from './types';
import { Welcome } from './components/tools/Welcome';
import { AllTools } from './components/tools/AllTools';
import { useAuth } from '../hooks/useAuth';
import { logToolUsage } from '../services/firebaseService';

const Sidebar: React.FC<{ 
    onSelectTool: (toolId: string) => void;
    activeToolId: string;
}> = ({ onSelectTool, activeToolId }) => {
    
    const [search, setSearch] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'Text': true,
        'Image': true,
        'Color': true,
        'Social & Content': true,
        'Developer': true,
        'Hacking': true,
    });

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({...prev, [category]: !prev[category]}));
    };
    
  const handleLinkClick = (toolId: string) => {
    onSelectTool(toolId);
  };

  const filteredTools = useMemo<Tool[]>(() => {
        if (!search) return ALL_TOOLS;
        return ALL_TOOLS.filter(tool => 
            tool.name.toLowerCase().includes(search.toLowerCase()) ||
            tool.description.toLowerCase().includes(search.toLowerCase())
        );
    }, [search]);

  const groupedTools = useMemo<Record<string, Tool[]>>(() => {
    return filteredTools.reduce((acc, tool) => {
      (acc[tool.category] = acc[tool.category] || []).push(tool);
      return acc;
    }, {} as Record<string, Tool[]>);
  }, [filteredTools]);
    
    return (
        <aside className="bg-secondary/50 backdrop-blur-xl border-r border-accent/20 w-full h-full flex flex-col">
            <div className="flex items-center justify-between space-x-3 p-4 border-b border-accent/20 flex-shrink-0 bg-secondary/30 backdrop-blur-sm">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-accent/10 rounded-lg backdrop-blur-sm border border-accent/20">
                      <svg className="w-6 h-6 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 12l4.179 2.25M6.429 9.75l5.571 3 5.571-3m0 0l4.179 2.25L12 14.25l-5.571-3" />
                      </svg>
                   </div>
                   <h1 className="text-xl font-bold text-light">Dev Toolbox</h1>
                 </div>
                 <div className="flex items-center gap-2">
                   <button
                     type="button"
                     onClick={() => {
                       // Navigate back to the main app root (hash router aware)
                       try {
                         const pathname = window.location.pathname || '/';
                         const basePath = pathname.replace(/\/toolbox.*$/, '/') || '/';
                         // Ensure we include the hash root used by the main app
                         const target = `${window.location.origin}${basePath}#/`;
                         window.location.assign(target);
                       } catch (err) {
                         window.location.assign('/#/');
                       }
                     }}
                     className="px-3 py-1 rounded text-sm text-light bg-secondary/50 hover:bg-secondary/70 backdrop-blur-sm transition-all duration-200 border border-accent/30 hover:border-accent/50"
                   >
                     Main Home
                   </button>
                 </div>
            </div>
            
      <nav className="flex-grow overflow-y-auto px-4 pb-4 space-y-2">
         <button type="button" onClick={() => handleLinkClick('welcome')} className={`w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${activeToolId === 'welcome' ? 'bg-accent/20 text-accent border border-accent/30' : 'hover:bg-secondary/50 text-slate-300 hover:text-light'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
          <span>Home</span>
        </button>
         <button type="button" onClick={() => handleLinkClick('all_tools')} className={`w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${activeToolId === 'all_tools' ? 'bg-accent/20 text-accent border border-accent/30' : 'hover:bg-secondary/50 text-slate-300 hover:text-light'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          <span>All Tools</span>
        </button>
        
        <div className="px-3 py-2">
          <input 
            type="text" 
            placeholder="Search tools..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-light placeholder-slate-400 bg-secondary/30 border border-accent/20 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-300"
          />
        </div>
                {(Object.entries(groupedTools) as [string, import('./types').Tool[]][]).map(([category, tools]) => (
                    <div key={category}>
                        <button onClick={() => toggleCategory(category)} className="w-full flex justify-between items-center text-left text-sm font-semibold text-slate-400 hover:text-accent px-3 py-2 rounded-lg transition-colors">
                            <span>{category}</span>
                            <svg className={`w-4 h-4 transition-transform ${expandedCategories[category] ? 'rotate-90' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                         {expandedCategories[category] && (
                            <div className="pl-4 mt-1 space-y-1 border-l border-accent/20 ml-2">
                {tools.map(tool => (
                  <button key={tool.id} type="button" onClick={() => handleLinkClick(tool.id)} className={`w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeToolId === tool.id ? 'bg-accent/20 text-accent border border-accent/30' : 'hover:bg-secondary/50 text-slate-300 hover:text-light'}`}>
                    <tool.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{tool.name}</span>
                  </button>
                ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>
        </aside>
    );
}

function App() {
  // All dev-toolbox routes should be namespaced under /toolbox
  const BASE = '/toolbox';

  const getLocationPath = () => {
    // Prefer the hash route if present so host app style is preserved: e.g. /#/toolbox/case-converter
    if (window.location.hash && window.location.hash.startsWith('#')) {
      return window.location.hash.slice(1); // drop leading '#'
    }
    return window.location.pathname;
  };

  const [pathname, setPathname] = useState(getLocationPath());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const onLocationChange = () => {
      setPathname(getLocationPath());
    };
    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('hashchange', onLocationChange);
    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('hashchange', onLocationChange);
    };
  }, []);

  const { currentUser } = useAuth();

  const handleSelectTool = useCallback((toolId: string) => {
    const targetPath = toolId === 'welcome' ? `${BASE}/` : (toolId === 'all_tools' ? `${BASE}/all-tools` : `${BASE}/${toolId}`);
    // Use hash routing so the main app's hash router continues to show the toolbox under /#/toolbox
    try {
      // set location.hash to '/toolbox/...' which becomes '#/toolbox/...'
      window.location.hash = targetPath;
    } catch (err) {
      // fallback to pushState
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ toolId }, '', targetPath);
      }
    }
    setPathname(targetPath);
    setIsSidebarOpen(false);

    // Log a lightweight 'open' usage event so global/user tool stats reflect visits.
    try {
      if (currentUser && toolId && toolId !== 'welcome' && toolId !== 'all_tools') {
        const meta = TOOL_MAP[toolId];
        const toolMeta = { id: toolId, name: meta?.name || toolId, category: meta?.category || 'Toolbox' };
        // fire-and-forget
        logToolUsage(currentUser.uid, toolMeta, 'open', '');
      }
    } catch (e) {
      // swallow errors - telemetry should not break navigation
      console.warn('Telemetry log failed', e);
    }
  }, []);

  const { activeToolId, ActiveToolComponent } = useMemo(() => {
    let currentToolId = 'welcome';
  // If app is served under BASE, strip it for routing logic
  const relativePath = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  if (relativePath === '/' || relativePath === '') {
    currentToolId = 'welcome';
  } else if (relativePath === '/all-tools') {
    currentToolId = 'all_tools';
  } else {
    const toolIdFromPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    if (TOOL_MAP[toolIdFromPath]) {
      currentToolId = toolIdFromPath;
    }
  }

    let Component;
    if (currentToolId === 'welcome') {
      Component = <Welcome />;
    } else if (currentToolId === 'all_tools') {
      Component = <AllTools onSelectTool={handleSelectTool} />;
    } else {
      const tool = TOOL_MAP[currentToolId];
      Component = tool ? <tool.component /> : <Welcome />;
    }

    return { activeToolId: currentToolId, ActiveToolComponent: Component };
  }, [pathname, handleSelectTool]);

  return (
    <div className="min-h-screen text-slate-200 flex" style={{ backgroundColor: 'var(--color-secondary, #061018)' }}>
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-20 right-4 z-[10000] p-3 rounded-lg text-light bg-accent/20 border-2 border-accent/40 hover:bg-accent/30 hover:border-accent/60 backdrop-blur-sm transition-all duration-200 shadow-lg shadow-accent/20"
        aria-label="Open sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

  <div className="hidden lg:block lg:w-72 lg:flex-shrink-0">
          <div className="sticky top-0 h-screen overflow-y-auto">
             <Sidebar onSelectTool={handleSelectTool} activeToolId={activeToolId} />
          </div>
      </div>
       
  <div className={`fixed inset-0 z-40 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:hidden`}>
        <div className="relative h-full w-72 z-50">
           <Sidebar onSelectTool={handleSelectTool} activeToolId={activeToolId} />
        </div>
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-40" onClick={() => setIsSidebarOpen(false)}></div>
      </div>

    <main className="flex-1 relative z-10 min-h-screen">
      <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto pt-24 lg:pt-32 pb-32 lg:pb-40">
        {ActiveToolComponent}
      </div>
    </main>
    </div>
  );
}

export default App;
