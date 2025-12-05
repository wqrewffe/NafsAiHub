import { db, serverTimestamp } from '../firebase/config';
import firebase from 'firebase/compat/app';

export interface AuditLog {
  id?: string;
  adminId: string;
  adminEmail: string;
  action: 'user_deleted' | 'user_blocked' | 'user_unblocked' | 'password_reset' | 'password_changed' | 
          'competition_deleted' | 'competition_visibility_changed' | 'tool_locked' | 'tool_unlocked' | 
          'alert_created' | 'ip_blocked' | 'ip_unblocked' | 'settings_updated' | 'other';
  targetType: 'user' | 'competition' | 'tool' | 'ip' | 'system' | 'other';
  targetId?: string;
  targetName?: string;
  targetEmail?: string;
  details: Record<string, any>;
  timestamp: firebase.firestore.Timestamp | Date;
  ipAddress?: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Log admin action
export const logAdminAction = async (
  adminId: string,
  adminEmail: string,
  action: AuditLog['action'],
  targetType: AuditLog['targetType'],
  details: Record<string, any>,
  targetId?: string,
  targetName?: string,
  targetEmail?: string,
  severity: AuditLog['severity'] = 'medium'
): Promise<void> => {
  try {
    // Collect user agent and IP info if available
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    
    await db.collection('auditLogs').add({
      adminId,
      adminEmail,
      action,
      targetType,
      targetId,
      targetName,
      targetEmail,
      details,
      timestamp: serverTimestamp(),
      userAgent,
      severity,
    });

    console.log(`[AUDIT] ${adminEmail} performed ${action} on ${targetType}:${targetId}`);
  } catch (err) {
    console.error('Failed to log admin action', err);
  }
};

// Get audit logs with filtering
export const getAuditLogs = async (
  filters?: {
    adminId?: string;
    action?: AuditLog['action'];
    targetType?: AuditLog['targetType'];
    severity?: AuditLog['severity'];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<AuditLog[]> => {
  try {
    const limit = filters?.limit || 500;
    let query: firebase.firestore.Query = db.collection('auditLogs');

    // Build query with filters
    if (filters?.action) {
      query = query.where('action', '==', filters.action);
    }
    if (filters?.targetType) {
      query = query.where('targetType', '==', filters.targetType);
    }
    if (filters?.severity) {
      query = query.where('severity', '==', filters.severity);
    }

    // Order by timestamp descending and apply limit
    query = query.orderBy('timestamp', 'desc').limit(limit);

    const snapshot = await query.get();

    const logs: AuditLog[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as any,
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
    }));

    // Client-side filtering for date range (Firestore doesn't support complex date queries easily)
    if (filters?.startDate || filters?.endDate) {
      return logs.filter(log => {
        const logTime = log.timestamp instanceof Date ? log.timestamp : (log.timestamp as any).toDate();
        if (filters.startDate && logTime < filters.startDate) return false;
        if (filters.endDate && logTime > filters.endDate) return false;
        return true;
      });
    }

    return logs;
  } catch (err) {
    console.error('Failed to fetch audit logs', err);
    return [];
  }
};

// Get audit logs for a specific admin
export const getAdminAuditLogs = async (adminId: string, limit: number = 200): Promise<AuditLog[]> => {
  try {
    const snapshot = await db.collection('auditLogs')
      .where('adminId', '==', adminId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as any,
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
    }));
  } catch (err) {
    console.error('Failed to fetch admin audit logs', err);
    return [];
  }
};

// Get audit logs for a specific user (target)
export const getUserAuditLogs = async (userId: string, limit: number = 100): Promise<AuditLog[]> => {
  try {
    const snapshot = await db.collection('auditLogs')
      .where('targetId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as any,
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
    }));
  } catch (err) {
    console.error('Failed to fetch user audit logs', err);
    return [];
  }
};

// Get audit statistics
export const getAuditStatistics = async (
  days: number = 30
): Promise<{
  totalActions: number;
  actionsByType: Record<string, number>;
  actionsBySeverity: Record<string, number>;
  topAdmins: Array<{ email: string; actionCount: number }>;
  recentCriticalActions: AuditLog[];
}> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await getAuditLogs({ limit: 2000 });
    
    // Filter by date
    const filteredLogs = logs.filter(log => {
      const logTime = log.timestamp instanceof Date ? log.timestamp : (log.timestamp as any).toDate();
      return logTime >= startDate;
    });

    // Count actions by type
    const actionsByType: Record<string, number> = {};
    const actionsBySeverity: Record<string, number> = {};
    const adminCounts: Record<string, number> = {};

    filteredLogs.forEach(log => {
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
      actionsBySeverity[log.severity] = (actionsBySeverity[log.severity] || 0) + 1;
      adminCounts[log.adminEmail] = (adminCounts[log.adminEmail] || 0) + 1;
    });

    const topAdmins = Object.entries(adminCounts)
      .map(([email, count]) => ({ email, actionCount: count }))
      .sort((a, b) => b.actionCount - a.actionCount)
      .slice(0, 5);

    const recentCriticalActions = filteredLogs
      .filter(log => log.severity === 'critical')
      .slice(0, 10);

    return {
      totalActions: filteredLogs.length,
      actionsByType,
      actionsBySeverity,
      topAdmins,
      recentCriticalActions,
    };
  } catch (err) {
    console.error('Failed to get audit statistics', err);
    return {
      totalActions: 0,
      actionsByType: {},
      actionsBySeverity: {},
      topAdmins: [],
      recentCriticalActions: [],
    };
  }
};
