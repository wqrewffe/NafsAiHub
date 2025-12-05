import { db, serverTimestamp } from '../firebase/config';
import firebase from 'firebase/compat/app';

export interface PageVisit {
  id?: string;
  userId: string;
  previousPage: string | null;
  currentPage: string;
  nextPage?: string | null;
  timestamp: firebase.firestore.Timestamp | Date;
  exitPage?: string | null;
  exitTimestamp?: firebase.firestore.Timestamp | Date;
  sessionId: string;
  timeSpentOnPage?: number; // in milliseconds
}

export interface UserPageNavigation {
  userId: string;
  visits: PageVisit[];
  currentPage: string | null;
  previousPage: string | null;
  sessionId: string;
  lastExitPage?: string | null;
}

// Track page view
export const logPageView = async (
  userId: string,
  currentPage: string,
  previousPage: string | null = null,
  sessionId: string,
  userEmail: string = ''
): Promise<void> => {
  try {
    await db.collection('users')
      .doc(userId)
      .collection('pageViews')
      .add({
        previousPage,
        currentPage,
        timestamp: serverTimestamp(),
        sessionId,
        timeSpentOnPage: 0,
        userEmail,
      });

    // Also update global page tracking
    await db.collection('globalPageNavigation').add({
      userId,
      previousPage,
      currentPage,
      timestamp: serverTimestamp(),
      sessionId,
      userEmail,
    });
  } catch (err) {
    console.error('Failed to log page view', err);
  }
};

// Log exit page
export const logPageExit = async (
  userId: string,
  exitPage: string,
  sessionId: string,
  timeSpentOnPage: number = 0,
  userEmail: string = ''
): Promise<void> => {
  try {
    await db.collection('users')
      .doc(userId)
      .collection('pageViews')
      .add({
        exitPage,
        timestamp: serverTimestamp(),
        sessionId,
        timeSpentOnPage,
        isExit: true,
        userEmail,
      });

    // Update global tracking
    await db.collection('globalPageNavigation').add({
      userId,
      exitPage,
      timestamp: serverTimestamp(),
      sessionId,
      isExit: true,
      timeSpentOnPage,
      userEmail,
    });
  } catch (err) {
    console.error('Failed to log page exit', err);
  }
};

// Get user's page navigation history
export const getUserPageNavigation = async (userId: string, limit: number = 100): Promise<PageVisit[]> => {
  try {
    const snapshot = await db.collection('users')
      .doc(userId)
      .collection('pageViews')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const visits: PageVisit[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as any,
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
    }));

    return visits;
  } catch (err) {
    console.error('Failed to fetch user page navigation', err);
    return [];
  }
};

// Get user's last page
export const getUserLastPage = async (userId: string): Promise<string | null> => {
  try {
    const snapshot = await db.collection('users')
      .doc(userId)
      .collection('pageViews')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const data = snapshot.docs[0].data();
    return data.currentPage || data.exitPage || null;
  } catch (err) {
    console.error('Failed to fetch user last page', err);
    return null;
  }
};

// Get all users' page navigation summary
export const getAllUsersPageNavigation = async (limit: number = 100): Promise<Map<string, UserPageNavigation>> => {
  try {
    const snapshot = await db.collection('globalPageNavigation')
      .orderBy('timestamp', 'desc')
      .limit(limit * 10) // Get more to aggregate properly
      .get();

    const navigationMap = new Map<string, UserPageNavigation>();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const userId = data.userId;

      if (!navigationMap.has(userId)) {
        navigationMap.set(userId, {
          userId,
          visits: [],
          currentPage: null,
          previousPage: null,
          sessionId: data.sessionId,
        });
      }

      const nav = navigationMap.get(userId)!;
      
      if (data.currentPage) {
        nav.currentPage = data.currentPage;
        nav.previousPage = data.previousPage || null;
      }
      
      if (data.exitPage) {
        nav.lastExitPage = data.exitPage;
      }

      nav.visits.push({
        userId,
        previousPage: data.previousPage || null,
        currentPage: data.currentPage || '',
        timestamp: data.timestamp?.toDate?.() || data.timestamp,
        exitPage: data.exitPage || null,
        sessionId: data.sessionId,
        timeSpentOnPage: data.timeSpentOnPage,
      });
    });

    return navigationMap;
  } catch (err) {
    console.error('Failed to fetch all users page navigation', err);
    return new Map();
  }
};

// Get user's complete navigation journey (from -> to -> exit)
export const getUserNavigationJourney = async (userId: string, limit: number = 50): Promise<PageVisit[]> => {
  try {
    const visits = await getUserPageNavigation(userId, limit);
    
    // Sort by timestamp descending to show newest first
    return visits.sort((a, b) => {
      const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : a.timestamp?.toMillis?.() || 0;
      const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : b.timestamp?.toMillis?.() || 0;
      return bTime - aTime;
    });
  } catch (err) {
    console.error('Failed to fetch user navigation journey', err);
    return [];
  }
};

// Get page analytics - most visited pages
export const getPageAnalytics = async (limit: number = 1000): Promise<{
  mostVisitedPages: Array<{ page: string; visits: number; uniqueUsers: number; avgTimeSpent: number }>;
  mostExitPages: Array<{ page: string; exits: number; percentage: number }>;
  pageTransitions: Array<{ from: string; to: string; count: number }>;
}> => {
  try {
    const ADMIN_EMAIL = 'nafisabdullah424@gmail.com';
    const snapshot = await db.collection('globalPageNavigation')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const pageVisits = new Map<string, { visits: number; users: Set<string>; totalTimeSpent: number }>();
    const exitPages = new Map<string, number>();
    const transitions = new Map<string, number>();
    let totalExits = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Skip admin user data
      if (data.userEmail === ADMIN_EMAIL) return;

      // Track page visits
      if (data.currentPage) {
        const existing = pageVisits.get(data.currentPage) || { visits: 0, users: new Set(), totalTimeSpent: 0 };
        existing.visits++;
        existing.users.add(data.userId);
        existing.totalTimeSpent += data.timeSpentOnPage || 0;
        pageVisits.set(data.currentPage, existing);
      }

      // Track exit pages
      if (data.exitPage) {
        exitPages.set(data.exitPage, (exitPages.get(data.exitPage) || 0) + 1);
        totalExits++;
      }

      // Track transitions
      if (data.previousPage && data.currentPage) {
        const key = `${data.previousPage} -> ${data.currentPage}`;
        transitions.set(key, (transitions.get(key) || 0) + 1);
      }
    });

    const mostVisitedPages = Array.from(pageVisits.entries())
      .map(([page, data]) => ({
        page,
        visits: data.visits,
        uniqueUsers: data.users.size,
        avgTimeSpent: data.visits > 0 ? data.totalTimeSpent / data.visits : 0
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 20);

    const mostExitPages = Array.from(exitPages.entries())
      .map(([page, count]) => ({
        page,
        exits: count,
        percentage: totalExits > 0 ? (count / totalExits) * 100 : 0
      }))
      .sort((a, b) => b.exits - a.exits)
      .slice(0, 20);

    const pageTransitionsList = Array.from(transitions.entries())
      .map(([transition, count]) => ({
        from: transition.split(' -> ')[0],
        to: transition.split(' -> ')[1],
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      mostVisitedPages,
      mostExitPages,
      pageTransitions: pageTransitionsList
    };
  } catch (err) {
    console.error('Failed to fetch page analytics', err);
    return {
      mostVisitedPages: [],
      mostExitPages: [],
      pageTransitions: []
    };
  }
};

// Get page stay time analytics
export const getPageStayTimeAnalytics = async (limit: number = 1000): Promise<Array<{
  page: string;
  avgTimeSpent: number;
  minTimeSpent: number;
  maxTimeSpent: number;
  totalTimeSpent: number;
  visits: number;
}>> => {
  try {
    const ADMIN_EMAIL = 'nafisabdullah424@gmail.com';
    const snapshot = await db.collection('globalPageNavigation')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const pageStats = new Map<string, { times: number[]; totalTime: number; count: number }>();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Skip admin user data
      if (data.userEmail === ADMIN_EMAIL) return;
      
      if (data.currentPage && data.timeSpentOnPage) {
        const existing = pageStats.get(data.currentPage) || { times: [], totalTime: 0, count: 0 };
        existing.times.push(data.timeSpentOnPage);
        existing.totalTime += data.timeSpentOnPage;
        existing.count++;
        pageStats.set(data.currentPage, existing);
      }
    });

    return Array.from(pageStats.entries())
      .map(([page, stats]) => ({
        page,
        avgTimeSpent: stats.count > 0 ? stats.totalTime / stats.count : 0,
        minTimeSpent: Math.min(...stats.times),
        maxTimeSpent: Math.max(...stats.times),
        totalTimeSpent: stats.totalTime,
        visits: stats.count
      }))
      .sort((a, b) => b.avgTimeSpent - a.avgTimeSpent);
  } catch (err) {
    console.error('Failed to fetch page stay time analytics', err);
    return [];
  }
};

// Get user flow analytics - funnel analysis
export const getUserFlowAnalytics = async (limit: number = 1000): Promise<{
  entryPages: Array<{ page: string; count: number; percentage: number }>;
  exitFlows: Array<{ from: string; to: string; count: number }>;
}> => {
  try {
    const ADMIN_EMAIL = 'nafisabdullah424@gmail.com';
    const snapshot = await db.collection('globalPageNavigation')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const entryPages = new Map<string, Set<string>>();
    const exitFlows = new Map<string, number>();
    let totalSessions = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Skip admin user data
      if (data.userEmail === ADMIN_EMAIL) return;
      
      // Entry pages are those with no previousPage
      if (data.currentPage && !data.previousPage) {
        const users = entryPages.get(data.currentPage) || new Set();
        users.add(data.userId);
        entryPages.set(data.currentPage, users);
        totalSessions++;
      }

      // Exit flows
      if (data.currentPage && data.exitPage) {
        const key = `${data.currentPage} -> ${data.exitPage}`;
        exitFlows.set(key, (exitFlows.get(key) || 0) + 1);
      }
    });

    const entryPagesList = Array.from(entryPages.entries())
      .map(([page, users]) => ({
        page,
        count: users.size,
        percentage: totalSessions > 0 ? (users.size / totalSessions) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    const exitFlowsList = Array.from(exitFlows.entries())
      .map(([flow, count]) => ({
        from: flow.split(' -> ')[0],
        to: flow.split(' -> ')[1],
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return {
      entryPages: entryPagesList,
      exitFlows: exitFlowsList
    };
  } catch (err) {
    console.error('Failed to fetch user flow analytics', err);
    return {
      entryPages: [],
      exitFlows: []
    };
  }
};
