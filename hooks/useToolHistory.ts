import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface ToolHistoryEntry {
  toolId: string;
  toolName: string;
  usedAt: string;
}

/**
 * Hook to track user's tool usage history
 */
export const useToolHistory = () => {
  const { currentUser } = useAuth();
  const [toolHistory, setToolHistory] = useState<ToolHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    if (!currentUser) {
      setToolHistory([]);
      return;
    }

    try {
      setIsLoading(true);
      const historyKey = `toolHistory_${currentUser.uid}`;
      const stored = localStorage.getItem(historyKey);
      
      if (stored) {
        const parsed = JSON.parse(stored) as ToolHistoryEntry[];
        // Sort by most recent first
        setToolHistory(parsed.sort((a, b) => 
          new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading tool history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.uid]);

  /**
   * Add a tool to the history
   */
  const addToHistory = (toolId: string, toolName: string) => {
    if (!currentUser) return;

    try {
      const historyKey = `toolHistory_${currentUser.uid}`;
      const stored = localStorage.getItem(historyKey);
      let history: ToolHistoryEntry[] = stored ? JSON.parse(stored) : [];

      // Remove duplicate if it exists
      history = history.filter(entry => entry.toolId !== toolId);

      // Add new entry
      const newEntry: ToolHistoryEntry = {
        toolId,
        toolName,
        usedAt: new Date().toISOString(),
      };

      history.unshift(newEntry);

      // Keep only last 50 items
      history = history.slice(0, 50);

      localStorage.setItem(historyKey, JSON.stringify(history));
      setToolHistory(history);
    } catch (error) {
      console.error('Error adding to tool history:', error);
    }
  };

  /**
   * Clear history
   */
  const clearHistory = () => {
    if (!currentUser) return;

    try {
      const historyKey = `toolHistory_${currentUser.uid}`;
      localStorage.removeItem(historyKey);
      setToolHistory([]);
    } catch (error) {
      console.error('Error clearing tool history:', error);
    }
  };

  return {
    toolHistory,
    isLoading,
    addToHistory,
    clearHistory,
  };
};
