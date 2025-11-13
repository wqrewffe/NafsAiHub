import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { globalSearch, SearchResult } from '../services/globalSearchService';
import { Tool } from '../types';
import './GlobalSearch.css';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  allTools: Tool[];
  toolHistory?: Array<{ toolId: string; toolName: string; usedAt: string }>;
}

const MagnifyingGlassIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.5 5.5a7.5 7.5 0 0010.5 10.5z" />
  </svg>
);

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5-6a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09l-.813 2.846zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.035-.259a3.375 3.375 0 002.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  allTools,
  toolHistory = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.trim()) {
        setIsSearching(true);
        try {
          console.log('Searching with term:', searchTerm, 'Tools available:', allTools?.length || 0, 'History:', toolHistory?.length || 0);
          const searchResults = await globalSearch(searchTerm, allTools, toolHistory);
          console.log('Search results:', searchResults);
          setResults(searchResults);
          setSelectedIndex(-1);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
      }
    }, 150); // Reduced debounce delay for real-time feel

    return () => clearTimeout(timer);
  }, [searchTerm, allTools, toolHistory]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleSelectResult(results[selectedIndex]);
          }
          break;
        default:
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, results, selectedIndex, onClose]);

  const handleSelectResult = useCallback((result: SearchResult) => {
    switch (result.type) {
      case 'tool':
        // Check if it's a built-in tool or a Firestore tool
        if (result.data.firestoreId) {
          // User-submitted tool from Firestore - check if it has a custom link
          if (result.data.link) {
            window.open(result.data.link, '_blank');
          } else {
            navigate(`/#/tools/${result.data.firestoreId}`);
          }
        } else if (result.data.path) {
          // Toolbox tool with path
          navigate(result.data.path);
        } else {
          // Built-in AI tool
          navigate(`/tools/${result.data.id}`);
        }
        break;
      case 'history':
        navigate(`/tools/${result.data.originalToolId || result.id.split('-')[0]}`);
        break;
      case 'user':
        navigate(`/profile/${result.data.displayName}-${result.id}`);
        break;
    }
    onClose();
  }, [navigate, onClose]);

  const getResultIcon = (result: SearchResult) => {
    switch (result.type) {
      case 'user':
        return <UserIcon className="h-5 w-5 text-blue-400" />;
      case 'history':
        return <ClockIcon className="h-5 w-5 text-amber-400" />;
      case 'tool':
        return result.data.icon ? (
          <SparklesIcon className="h-5 w-5 text-purple-400" />
        ) : (
          <SparklesIcon className="h-5 w-5 text-slate-400" />
        );
      default:
        return null;
    }
  };

  const groupedResults = {
    tools: results.filter(r => r.type === 'tool'),
    history: results.filter(r => r.type === 'history'),
    users: results.filter(r => r.type === 'user'),
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
        <div
          className="w-full max-w-2xl bg-slate-900 rounded-lg shadow-2xl border border-slate-700 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="p-4 border-b border-slate-700 bg-slate-800">
            <div className="flex items-center gap-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search tools, history, or users by email/username..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-white placeholder-slate-400 outline-none text-lg"
              />
              <button
                onClick={onClose}
                className="flex-shrink-0 text-slate-400 hover:text-white transition-colors p-1"
                aria-label="Close search"
                title="Close (Esc)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {isSearching ? (
              <div className="p-8 text-center text-slate-400">
                <div className="inline-block animate-spin">
                  <SparklesIcon className="h-6 w-6" />
                </div>
                <p className="mt-2">Searching...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="p-2">
                {/* Tools Section */}
                {groupedResults.tools.length > 0 && (
                  <div className="mb-4">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Tools ({groupedResults.tools.length})
                    </div>
                    {groupedResults.tools.map((result, idx) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelectResult(result)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                          results.indexOf(result) === selectedIndex
                            ? 'bg-primary/20 border border-primary'
                            : 'hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {getResultIcon(result)}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-white truncate">
                              {result.title}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {result.category || result.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* History Section */}
                {groupedResults.history.length > 0 && (
                  <div className="mb-4">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Your History ({groupedResults.history.length})
                    </div>
                    {groupedResults.history.map((result, idx) => (
                      <button
                        key={`${result.id}-${idx}`}
                        onClick={() => handleSelectResult(result)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                          results.indexOf(result) === selectedIndex
                            ? 'bg-amber-500/20 border border-amber-400'
                            : 'hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {getResultIcon(result)}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-white truncate">
                              {result.title}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {result.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Users Section */}
                {groupedResults.users.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Users ({groupedResults.users.length})
                    </div>
                    {groupedResults.users.map((result, idx) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelectResult(result)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                          results.indexOf(result) === selectedIndex
                            ? 'bg-blue-500/20 border border-blue-400'
                            : 'hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {getResultIcon(result)}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-white truncate">
                              {result.title}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {result.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : searchTerm ? (
              <div className="p-8 text-center text-slate-400">
                <MagnifyingGlassIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No results found for "{searchTerm}"</p>
                <p className="text-xs mt-2">Try searching for tools, your history, or users</p>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <SparklesIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Start typing to search</p>
                <p className="text-xs mt-2">Search from 200+ tools, your history, or find users</p>
              </div>
            )}
          </div>

          {/* Footer Tips */}
          {results.length > 0 && (
            <div className="p-3 border-t border-slate-700 bg-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <div>
                <span className="inline-block mr-4">↑↓ Navigate</span>
                <span className="inline-block">Enter Select</span>
              </div>
              <span>Esc Close</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GlobalSearch;
