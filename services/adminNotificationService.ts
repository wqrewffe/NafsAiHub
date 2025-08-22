import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';

interface NotificationTemplate {
  id: string;
  title: string;
  message: string;
  type: 'achievement' | 'reward' | 'streak' | 'referral' | 'suggestion' | 'milestone' | 'challenge';
  reward?: {
    type: 'xp' | 'points' | 'feature' | 'badge';
    amount?: number;
    item?: string;
  };
  priority: 'low' | 'medium' | 'high';
  triggerCondition?: {
    type: 'toolUse' | 'streak' | 'login' | 'timeSpent' | 'achievement' | 'referral';
    value?: number;
  };
  active: boolean;
  createdAt: Date;
}

export const adminNotificationService = {
  async createNotificationTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt'>) {
    const templatesRef = collection(db, 'notificationTemplates');
    await addDoc(templatesRef, {
      ...template,
      createdAt: new Date()
    });
  },

  async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    const templatesRef = collection(db, 'notificationTemplates');
    const snapshot = await getDocs(templatesRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as NotificationTemplate));
  },

  async toggleTemplateActive(templateId: string, active: boolean) {
    const templateRef = doc(db, 'notificationTemplates', templateId);
    await updateDoc(templateRef, { active });
  },

  async deleteTemplate(templateId: string) {
    const templateRef = doc(db, 'notificationTemplates', templateId);
    await deleteDoc(templateRef);
  },

  async getNotificationStats() {
    const notificationsRef = collection(db, 'notifications');
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get total notifications sent in last 24 hours
    const recentQuery = query(
      notificationsRef,
      where('createdAt', '>=', yesterday)
    );
    const recentSnap = await getDocs(recentQuery);

    // Calculate engagement rates
    const notificationStats = {
      totalSent: recentSnap.size,
      engagementRates: {
        clicked: 0,
        dismissed: 0,
        ignored: 0
      },
      byType: {} as Record<string, number>
    };

    recentSnap.forEach(doc => {
      const data = doc.data();
      // Count by type
      notificationStats.byType[data.type] = (notificationStats.byType[data.type] || 0) + 1;
      
      // Calculate engagement
      if (data.clicked) notificationStats.engagementRates.clicked++;
      else if (data.dismissed) notificationStats.engagementRates.dismissed++;
      else notificationStats.engagementRates.ignored++;
    });

    // Convert to percentages
    const total = recentSnap.size;
    notificationStats.engagementRates.clicked = Math.round((notificationStats.engagementRates.clicked / total) * 100);
    notificationStats.engagementRates.dismissed = Math.round((notificationStats.engagementRates.dismissed / total) * 100);
    notificationStats.engagementRates.ignored = Math.round((notificationStats.engagementRates.ignored / total) * 100);

    return notificationStats;
  }
};
