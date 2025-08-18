

import { db, serverTimestamp } from '../firebase/config';
import { HistoryItem, FirestoreUser, Todo, Note } from '../types';
import firebase from 'firebase/compat/app';

export const createUserProfileDocument = async (user: firebase.User, password?: string) => {
  if (!user) return;
  const userRef = db.collection('users').doc(user.uid);
  const snapshot = await userRef.get();
  if (!snapshot.exists) {
    const { email, displayName } = user;
    const createdAt = serverTimestamp();
    try {
      const userData: any = {
        displayName,
        email,
        createdAt,
        totalUsage: 0,
      };

      if (password) {
        userData.password = password;
      }
      
      await userRef.set(userData, { merge: true });
    } catch (error) {
      console.error("Error creating user profile", error);
    }
  }
};

export const logToolUsage = async (
  userId: string,
  tool: { id: string; name: string; category: string; },
  prompt: string,
  response: string
) => {
  try {
    const userRef = db.collection('users').doc(userId);
    const historyCollection = userRef.collection('history');
    const userToolUsageRef = userRef.collection('toolUsage').doc(tool.id);
    const globalToolStatRef = db.collection('toolStats').doc(tool.id);
    const globalHistoryRef = db.collection('globalHistory');

    const timestamp = serverTimestamp();

    // 1. Add to user's personal history (fire and forget)
    historyCollection.add({
      toolId: tool.id,
      toolName: tool.name,
      prompt,
      response,
      timestamp,
    });
    
    // 2. Update global tool usage count
    globalToolStatRef.set({
        useCount: firebase.firestore.FieldValue.increment(1),
        toolName: tool.name,
        toolId: tool.id,
        category: tool.category,
    }, { merge: true });

    // 3. Update user-specific tool usage count
    userToolUsageRef.set({
        count: firebase.firestore.FieldValue.increment(1),
        lastUsed: timestamp,
        toolName: tool.name,
        toolId: tool.id,
    }, { merge: true });
    
    // 4. Update user's total usage count for admin dashboard
    userRef.set({
        totalUsage: firebase.firestore.FieldValue.increment(1)
    }, { merge: true });

    // 5. Add to global history feed for admin dashboard
    globalHistoryRef.add({
        userId,
        toolId: tool.id,
        toolName: tool.name,
        timestamp,
    });

  } catch (error) {
    console.error('Error logging tool usage: ', error);
  }
};


export const onToolHistorySnapshot = (
  userId: string,
  toolId: string,
  onUpdate: (history: HistoryItem[]) => void
): (() => void) => {
  const historyRef = db.collection('users').doc(userId).collection('history');
  const q = historyRef.where('toolId', '==', toolId).orderBy('timestamp', 'desc').limit(25);

  const unsubscribe = q.onSnapshot((querySnapshot) => {
    const history: HistoryItem[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Firestore timestamps can be null temporarily on the client during optimistic writes
      if (data.timestamp) {
        history.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate(),
        } as HistoryItem);
      }
    });
    onUpdate(history);
  }, (error) => {
    console.error(`Error listening to history for tool ${toolId}:`, error);
  });

  return unsubscribe;
};

export const getTopUsedToolsGlobal = async (limit?: number) => {
  let query: firebase.firestore.Query = db.collection('toolStats').orderBy('useCount', 'desc');
  if (limit) {
    query = query.limit(limit);
  }
  const snapshot = await query.get();
  
  const tools = snapshot.docs.map(doc => ({
      toolId: doc.id,
      ...doc.data()
  }));
  
  return tools as { toolId: string, useCount: number, toolName: string, category: string }[];
};

export const getTopUsedToolsForUser = async (userId: string, limit: number = 7) => {
  const userToolUsageRef = db.collection('users').doc(userId).collection('toolUsage');
  const snapshot = await userToolUsageRef.orderBy('count', 'desc').limit(limit).get();
  
  const tools = snapshot.docs.map(doc => ({
      toolId: doc.id,
      ...doc.data()
  }));

  return tools as { toolId: string, count: number, toolName: string }[];
};

export const getAllUsers = async (
    sortBy: 'createdAt' | 'totalUsage' = 'createdAt', 
    sortDir: 'desc' | 'asc' = 'desc', 
    limit?: number
): Promise<FirestoreUser[]> => {
    let query = db.collection('users').orderBy(sortBy, sortDir);
    if(limit) {
        query = query.limit(limit);
    }
    const snapshot = await query.get();

    const users = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            displayName: data.displayName || 'N/A',
            email: data.email || 'N/A',
            createdAt: data.createdAt,
            totalUsage: data.totalUsage || 0,
            password: data.password || undefined,
        } as FirestoreUser
    });

    return users;
};

export const getFullUserHistory = async (userId: string): Promise<HistoryItem[]> => {
    const historyRef = db.collection('users').doc(userId).collection('history');
    const snapshot = await historyRef.orderBy('timestamp', 'desc').get();
    
    const history: HistoryItem[] = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.timestamp) {
            history.push({
                id: doc.id,
                ...data,
                timestamp: data.timestamp.toDate(),
            } as HistoryItem);
        }
    });

    return history;
};

// Admin Dashboard Specific Functions
export interface DashboardStats {
    totalUsers: number;
    totalUsage: number;
    newUsers7Days: number;
    newUsers30Days: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const usersRef = db.collection('users');
    const toolStatsRef = db.collection('toolStats');
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [usersSnapshot, toolStatsSnapshot, newUsers7DaysSnapshot, newUsers30DaysSnapshot] = await Promise.all([
        usersRef.get(),
        toolStatsRef.get(),
        usersRef.where('createdAt', '>=', sevenDaysAgo).get(),
        usersRef.where('createdAt', '>=', thirtyDaysAgo).get()
    ]);

    const totalUsers = usersSnapshot.size;
    const newUsers7Days = newUsers7DaysSnapshot.size;
    const newUsers30Days = newUsers30DaysSnapshot.size;

    let totalUsage = 0;
    toolStatsSnapshot.forEach(doc => {
        totalUsage += doc.data().useCount || 0;
    });

    return { totalUsers, totalUsage, newUsers7Days, newUsers30Days };
};


export interface GlobalHistoryItem {
    id: string;
    userId: string;
    toolId: string;
    toolName: string;
    timestamp: Date;
}

export const getRecentActivity = async (limit: number = 5): Promise<GlobalHistoryItem[]> => {
    const historyRef = db.collection('globalHistory');
    const snapshot = await historyRef.orderBy('timestamp', 'desc').limit(limit).get();
    
    const activity: GlobalHistoryItem[] = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.timestamp) {
            activity.push({
                id: doc.id,
                ...data,
                timestamp: data.timestamp.toDate(),
            } as GlobalHistoryItem);
        }
    });
    return activity;
};

export const updateAuthSettings = async (settings: { isGoogleAuthDisabled: boolean }) => {
    const settingsRef = db.collection('settings').doc('auth');
    await settingsRef.set(settings, { merge: true });
};

// Todo Functions
export const onTodosSnapshot = (
  userId: string,
  onUpdate: (todos: Todo[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  const todosRef = db.collection('users').doc(userId).collection('todos');
  const unsubscribe = todosRef.onSnapshot((querySnapshot) => {
    const todos: Todo[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      todos.push({
        id: doc.id,
        text: data.text || '',
        completed: data.completed || false,
        priority: data.priority || 'medium',
        dueDate: data.dueDate || null,
        createdAt: data.createdAt, 
        completedAt: data.completedAt || null,
        subtasks: data.subtasks || [],
        tags: data.tags || [],
        recurring: data.recurring || 'none',
      } as Todo);
    });
    onUpdate(todos);
  }, (error) => {
    console.error(`Error listening to todos:`, error);
    onError(error);
  });
  return unsubscribe;
};

export const addTodo = async (userId: string, todoData: Omit<Todo, 'id' | 'createdAt' | 'completedAt'>) => {
  const todosRef = db.collection('users').doc(userId).collection('todos');
  await todosRef.add({
    ...todoData,
    createdAt: serverTimestamp(),
    completedAt: null,
  });
};

export const updateTodo = async (userId: string, todoId: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => {
  const todoRef = db.collection('users').doc(userId).collection('todos').doc(todoId);
  const updatePayload: { [key: string]: any } = { ...updates };
  if (updates.completed !== undefined) {
      updatePayload.completedAt = updates.completed ? serverTimestamp() : null;
  }
  await todoRef.update(updatePayload);
};

export const updateSubtask = async (userId: string, todoId: string, subtaskId: string, completed: boolean) => {
    const todoRef = db.collection('users').doc(userId).collection('todos').doc(todoId);
    const todoDoc = await todoRef.get();
    if (!todoDoc.exists) throw new Error("Todo not found");

    const todoData = todoDoc.data() as Todo;
    const updatedSubtasks = todoData.subtasks.map(sub => 
        sub.id === subtaskId ? { ...sub, completed } : sub
    );
    
    // Check if all subtasks are completed to mark the parent task as completed
    const allSubtasksCompleted = updatedSubtasks.every(s => s.completed);
    const updates: { subtasks: any, completed?: boolean, completedAt?: any } = { subtasks: updatedSubtasks };
    
    if (allSubtasksCompleted && !todoData.completed) {
        updates.completed = true;
        updates.completedAt = serverTimestamp();
    } else if (!allSubtasksCompleted && todoData.completed) {
        updates.completed = false;
        updates.completedAt = null;
    }

    await todoRef.update(updates);
};

export const deleteTodo = async (userId: string, todoId: string) => {
  const todoRef = db.collection('users').doc(userId).collection('todos').doc(todoId);
  await todoRef.delete();
};


// Note Functions
export const onNotesSnapshot = (
  userId: string,
  onUpdate: (notes: Note[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  const notesRef = db.collection('users').doc(userId).collection('notes');
  const unsubscribe = notesRef.orderBy('lastModified', 'desc').onSnapshot((querySnapshot) => {
    const notes: Note[] = [];
    querySnapshot.forEach((doc) => {
      notes.push({ id: doc.id, ...doc.data() } as Note);
    });
    onUpdate(notes);
  }, (error) => {
    console.error(`Error listening to notes:`, error);
    onError(error);
  });
  return unsubscribe;
};

export const addNote = async (userId: string, noteData: Omit<Note, 'id'>) => {
  const notesRef = db.collection('users').doc(userId).collection('notes');
  const newNoteRef = await notesRef.add(noteData);
  return newNoteRef.id;
};

export const updateNote = async (userId: string, noteId: string, updates: Partial<Omit<Note, 'id'>>) => {
  const noteRef = db.collection('users').doc(userId).collection('notes').doc(noteId);
  await noteRef.update({
    ...updates,
    lastModified: Date.now(), // Always update lastModified on update
  });
};

export const deleteNote = async (userId: string, noteId: string) => {
  const noteRef = db.collection('users').doc(userId).collection('notes').doc(noteId);
  await noteRef.delete();
};
