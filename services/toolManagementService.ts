import { db } from '../firebase/config';
import { Tool, ToolSettings } from '../types';

export const updateToolSettings = async (toolId: string, settings: ToolSettings) => {
    const toolSettingsRef = db.collection('toolSettings').doc(toolId);
    await toolSettingsRef.set(settings, { merge: true });
};

export const getToolSettings = async (toolId: string): Promise<ToolSettings> => {
    const toolSettingsRef = db.collection('toolSettings').doc(toolId);
    const doc = await toolSettingsRef.get();
    
    if (doc.exists) {
        return doc.data() as ToolSettings;
    }
    
    // Default settings if none exist
    return {
        isHidden: false,
        restrictedTo: [],
        usageQuota: {
            dailyLimit: 0, // 0 means unlimited
            monthlyLimit: 0,
            resetDay: 1
        },
        accessSchedule: []
    };
};

export const getAllToolSettings = async (): Promise<Record<string, ToolSettings>> => {
    const toolSettingsRef = db.collection('toolSettings');
    const snapshot = await toolSettingsRef.get();
    
    const settings: Record<string, ToolSettings> = {};
    snapshot.forEach(doc => {
        settings[doc.id] = doc.data() as ToolSettings;
    });
    
    return settings;
};
