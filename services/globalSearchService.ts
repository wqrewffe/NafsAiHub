import { db } from '../firebase/config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Tool } from '../types';
import type { ComponentType } from 'react';
export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category?: string;
  type: 'tool' | 'history' | 'user';
  icon?: string | ComponentType<{ className?: string }>;
  data?: any;
  relevanceScore?: number;
}


/**
 * Calculate relevance score for better ranking
 */
const calculateRelevance = (searchTerm: string, title: string, description: string): number => {
  const lowerTerm = searchTerm.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const lowerDesc = description.toLowerCase();
  
  let score = 0;
  
  // Exact match scores highest
  if (lowerTitle === lowerTerm) score += 100;
  // Starts with search term scores high
  else if (lowerTitle.startsWith(lowerTerm)) score += 50;
  // Contains search term
  else if (lowerTitle.includes(lowerTerm)) score += 30;
  
  // Description matches score lower
  if (lowerDesc.includes(lowerTerm)) score += 10;
  
  return score;
};

/**
 * Search all available tools (200+ tools)
 */
export const searchTools = (searchTerm: string, allTools: Tool[]): SearchResult[] => {
  if (!searchTerm.trim() || !allTools || allTools.length === 0) return [];

  const lowerTerm = searchTerm.toLowerCase();
  
  return allTools
    .filter(tool => 
      tool.name.toLowerCase().includes(lowerTerm) ||
      tool.description.toLowerCase().includes(lowerTerm) ||
      tool.category.toLowerCase().includes(lowerTerm)
    )
    .map(tool => ({
      id: tool.id,
      title: tool.name,
      description: tool.description,
      category: tool.category,
      type: 'tool' as const,
      icon: tool.icon,
      data: tool,
      relevanceScore: calculateRelevance(searchTerm, tool.name, tool.description),
    }))
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    .slice(0, 10); // Limit to 10 results
};

/**
 * Search user's tool usage history
 */
export const searchToolHistory = (
  searchTerm: string,
  toolHistory: Array<{ toolId: string; toolName: string; usedAt: string }> = []
): SearchResult[] => {
  if (!searchTerm.trim() || !toolHistory || toolHistory.length === 0) return [];

  const lowerTerm = searchTerm.toLowerCase();

  return toolHistory
    .filter(entry =>
      entry.toolName.toLowerCase().includes(lowerTerm)
    )
    .map((entry, idx) => ({
      id: `${entry.toolId}-${idx}`,
      title: entry.toolName,
      description: `Last used: ${new Date(entry.usedAt).toLocaleString()}`,
      type: 'history' as const,
      data: {
        ...entry,
        originalToolId: entry.toolId,
      },
      relevanceScore: calculateRelevance(searchTerm, entry.toolName, entry.toolName),
    }))
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    .slice(0, 5); // Limit to 5 results
};

/**
 * Search users by email or username
 */
export const searchUsers = async (
  searchTerm: string
): Promise<SearchResult[]> => {
  if (!searchTerm.trim() || searchTerm.length < 2) return [];

  const lowerTerm = searchTerm.toLowerCase();
  const results: SearchResult[] = [];

  try {
    // Get a larger sample of users for client-side filtering
    // This is safer than complex Firestore queries
    const usersQuery = query(
      collection(db, 'users'),
      limit(100)
    );
    
    const snapshots = await getDocs(usersQuery);
    
    snapshots.forEach(doc => {
      const displayName = doc.data().displayName || '';
      const email = doc.data().email || '';
      
      // Match on display name or email (client-side filtering)
      if (displayName.toLowerCase().includes(lowerTerm) || 
          email.toLowerCase().includes(lowerTerm)) {
        const relevanceScore = calculateRelevance(searchTerm, displayName, email);
        results.push({
          id: doc.id,
          title: displayName || 'Unknown',
          description: email,
          type: 'user' as const,
          data: {
            uid: doc.id,
            displayName: displayName,
            email: email,
            avatarUrl: doc.data().avatarUrl,
          },
          relevanceScore,
        });
      }
    });

    return results
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 5);
  } catch (error) {
    console.error('Error searching users:', error);
    console.error('Make sure Firestore security rules allow reading from /users collection');
    return [];
  }
};

/**
 * Search Firestore tools collection (user-submitted tools)
 */
export const searchFirestoreTools = async (searchTerm: string): Promise<SearchResult[]> => {
  if (!searchTerm.trim()) return [];

  const lowerTerm = searchTerm.toLowerCase();
  const results: SearchResult[] = [];

  try {
    // Get all tools from Firestore (with a reasonable limit)
    const toolsQuery = query(
      collection(db, 'tools'),
      limit(50)
    );

    const snapshots = await getDocs(toolsQuery);

    snapshots.forEach(doc => {
      const toolData = doc.data();
      const name = toolData.name || toolData.title || '';
      const description = toolData.description || '';
      const category = toolData.category || 'User Tools';

      // Match on name, description, or category
      if (
        name.toLowerCase().includes(lowerTerm) ||
        description.toLowerCase().includes(lowerTerm) ||
        category.toLowerCase().includes(lowerTerm)
      ) {
        const relevanceScore = calculateRelevance(searchTerm, name, description);
        results.push({
          id: doc.id,
          title: name,
          description: description,
          category: category,
          type: 'tool' as const,
          data: {
            ...toolData,
            firestoreId: doc.id,
          },
          relevanceScore,
        });
      }
    });

    return results
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 5);
  } catch (error) {
    console.error('Error searching Firestore tools:', error);
    return [];
  }
};

/**
 * Perform global search across all categories
 */
export const globalSearch = async (
  searchTerm: string,
  allTools: Tool[],
  toolHistory: Array<{ toolId: string; toolName: string; usedAt: string }> = []
): Promise<SearchResult[]> => {
  const toolResults = searchTools(searchTerm, allTools);
  const historyResults = searchToolHistory(searchTerm, toolHistory);
  const userResults = await searchUsers(searchTerm);
  const firestoreToolResults = await searchFirestoreTools(searchTerm);

  // Combine and remove duplicates
  const combined = [...toolResults, ...firestoreToolResults, ...historyResults, ...userResults];
  const seen = new Set<string>();
  
  return combined.filter(result => {
    const key = `${result.type}-${result.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
