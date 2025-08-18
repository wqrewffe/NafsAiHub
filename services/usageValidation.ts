import { TimeWindow, UsageQuota } from '../types';
import { db } from '../firebase/config';

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
type DayOfWeek = typeof DAYS_OF_WEEK[number];

export const isWithinTimeWindow = (schedule: TimeWindow[]): boolean => {
    if (!schedule || schedule.length === 0) return true;

    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = DAYS_OF_WEEK[now.getDay()] as DayOfWeek;

    return schedule.some(window => {
        const isValidHour = currentHour >= window.startHour && currentHour < window.endHour;
        const isValidDay = window.days.includes(currentDay as any);
        return isValidHour && isValidDay;
    });
};

export const checkUsageQuota = async (userId: string, toolId: string, usageQuota?: UsageQuota): Promise<boolean> => {
    if (!usageQuota || (!usageQuota.dailyLimit && !usageQuota.monthlyLimit)) return true;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Get start of month or reset day
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const resetDay = usageQuota.resetDay || 1;
    let monthStart: Date;
    
    if (now.getDate() >= resetDay) {
        monthStart = new Date(currentYear, currentMonth, resetDay);
    } else {
        monthStart = new Date(currentYear, currentMonth - 1, resetDay);
    }

    const monthStartTime = monthStart.getTime();

    // Get usage counts from firestore
    const historyRef = db.collection('users').doc(userId).collection('history');
    
    if (usageQuota.dailyLimit > 0) {
        const dailyCount = await historyRef
            .where('toolId', '==', toolId)
            .where('timestamp', '>=', startOfDay)
            .get()
            .then(snap => snap.size);

        if (dailyCount >= usageQuota.dailyLimit) {
            return false;
        }
    }

    if (usageQuota.monthlyLimit > 0) {
        const monthlyCount = await historyRef
            .where('toolId', '==', toolId)
            .where('timestamp', '>=', monthStartTime)
            .get()
            .then(snap => snap.size);

        if (monthlyCount >= usageQuota.monthlyLimit) {
            return false;
        }
    }

    return true;
};
