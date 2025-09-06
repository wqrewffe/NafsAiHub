import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Badge } from '../types';
import { useAuth } from './useAuth';
import { getToolUsageInfo } from '../services/toolUsageService';
import { calculateBadges, calculateLevel } from '../services/badgeService';
import { db } from '../firebase/config';
import CongratulationsModal from '../components/CongratulationsModal';

interface CongratulationsState {
    isOpen: boolean;
    type: 'badge' | 'points' | 'level' | 'success' | 'error';
    data: {
        badge?: Badge;
        points?: number;
        level?: string;
        message?: string;
        title?: string;
        toolId?: string;
        newBalance?: number;
        redirectTo?: string;
    };
}

interface CongratulationsContextType {
    showCongratulations: (type: 'badge' | 'points' | 'level' | 'success' | 'error', data: any) => void;
    hideCongratulations: () => void;
    checkForAchievements: () => Promise<void>;
}

const CongratulationsContext = createContext<CongratulationsContextType | undefined>(undefined);

export const useCongratulations = () => {
    const context = useContext(CongratulationsContext);
    if (!context) {
        throw new Error('useCongratulations must be used within a CongratulationsProvider');
    }
    return context;
};

interface CongratulationsProviderProps {
    children: React.ReactNode;
}

export const CongratulationsProvider: React.FC<CongratulationsProviderProps> = ({ children }) => {
    const { currentUser } = useAuth();
    const [congratulations, setCongratulations] = useState<CongratulationsState>({
        isOpen: false,
        type: 'badge',
        data: {}
    });
    
    // Ref to prevent concurrent checks
    const isChecking = useRef(false);

    // Helper function to get localStorage key for current user
    const getStorageKey = (key: string) => {
        return currentUser ? `congrats_${currentUser.uid}_${key}` : null;
    };

    // Helper function to get stored value
    const getStoredValue = (key: string, defaultValue: any) => {
        const storageKey = getStorageKey(key);
        if (!storageKey) return defaultValue;
        
        try {
            const stored = localStorage.getItem(storageKey);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch {
            return defaultValue;
        }
    };

    // Helper function to set stored value
    const setStoredValue = (key: string, value: any) => {
        const storageKey = getStorageKey(key);
        if (!storageKey) return;
        
        try {
            localStorage.setItem(storageKey, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    };

    const showCongratulations = (type: 'badge' | 'points' | 'level', data: any) => {
        setCongratulations({
            isOpen: true,
            type,
            data
        });
    };

    const hideCongratulations = () => {
        setCongratulations(prev => ({ ...prev, isOpen: false }));
    };

    // Check for new badges and points
    const checkForAchievements = async () => {
        if (!currentUser || isChecking.current) return;
        
        isChecking.current = true;

        try {
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            if (!userDoc.exists) return;
            const userData = userDoc.data()!;
            
            const toolUsageInfo = await getToolUsageInfo(currentUser.uid);
            if (!toolUsageInfo) return;

            const referralInfo = userData.referralInfo || {};
            const currentReferrals = referralInfo.referralsCount || 0;
            const currentPoints = referralInfo.rewards || 0;

            const currentReferralBadges = calculateBadges(currentReferrals);
            const { currentLevel } = calculateLevel(currentReferrals);

            const allCurrentBadges = [...currentReferralBadges, ...toolUsageInfo.badges];

            const lastCheckTime = getStoredValue('lastCheckTime', 0);
            const isInitialCheck = lastCheckTime === 0;

            let shownAchievements = getStoredValue('shownAchievements', {});

            // On the very first check, establish a baseline of current achievements without showing them.
            if (isInitialCheck) {
                const initialAchievements: Record<string, any> = {};
                const now = Date.now();
                allCurrentBadges.forEach(badge => {
                    initialAchievements[`badge_${badge.type}`] = { shown: true, timestamp: now };
                });
                initialAchievements[`level_${currentLevel}`] = { shown: true, timestamp: now };
                // We don't baseline points to allow showing points gained while the user was away.

                setStoredValue('shownAchievements', initialAchievements);
                setStoredValue('badges', allCurrentBadges);
                setStoredValue('points', currentPoints);
                setStoredValue('level', currentLevel);
                setStoredValue('lastCheckTime', Date.now());
                return;
            }
            
            // --- Check for New Badges ---
            for (const currentBadge of allCurrentBadges) {
                const achievementKey = `badge_${currentBadge.type}`;
                if (!shownAchievements[achievementKey]?.shown) {
                    showCongratulations('badge', { badge: currentBadge });
                    
                    // Mark as shown and immediately update state to prevent re-triggering
                    shownAchievements[achievementKey] = { shown: true, timestamp: Date.now() };
                    setStoredValue('shownAchievements', shownAchievements);
                    setStoredValue('badges', allCurrentBadges);
                    
                    // Show one achievement at a time
                    return; 
                }
            }
            setStoredValue('badges', allCurrentBadges);


            // --- Check for New Points ---
            const storedPoints = getStoredValue('points', 0);
            if (currentPoints > storedPoints) {
                const pointsGained = currentPoints - storedPoints;
                if (pointsGained > 0) {
                     // Unlike badges, we show points every time they are gained.
                    showCongratulations('points', { 
                        points: pointsGained,
                        message: `You earned ${pointsGained} points!`
                    });
                    setStoredValue('points', currentPoints);
                    return; // Show one achievement at a time
                }
            }
             setStoredValue('points', currentPoints);

            // --- Check for Level Up ---
            const storedLevel = getStoredValue('level', '');
            if (currentLevel !== storedLevel && storedLevel !== '') { // Ensure it's a genuine level up
                const achievementKey = `level_${currentLevel}`;
                if (!shownAchievements[achievementKey]?.shown) {
                    showCongratulations('level', { 
                        level: currentLevel,
                        message: `You've reached ${currentLevel} level!`
                    });
                    
                    shownAchievements[achievementKey] = { shown: true, timestamp: Date.now() };
                    setStoredValue('shownAchievements', shownAchievements);
                    setStoredValue('level', currentLevel);
                    return; // Show one achievement at a time
                }
            }
            setStoredValue('level', currentLevel);

            setStoredValue('lastCheckTime', Date.now());

        } catch (error) {
            console.error('Error checking for achievements:', error);
        } finally {
            isChecking.current = false;
        }
    };

    useEffect(() => {
        if (currentUser) {
            // A small delay on the initial check to allow data to propagate
            const initialCheckTimeout = setTimeout(checkForAchievements, 2000); 

            const interval = setInterval(checkForAchievements, 30000); // Check every 30 seconds

            // Listen for real-time events from Firebase
            const unsubscribeEvents = db.collection('userEvents')
                .where('userId', '==', currentUser.uid)
                .where('read', '==', false)
                .onSnapshot(snapshot => {
                    snapshot.docChanges().forEach(async change => {
                        if (change.type === 'added') {
                            const event = change.doc.data();
                            showCongratulations(event.type, event.data);
                            
                            // Mark as read
                            await db.collection('userEvents').doc(change.doc.id).update({
                                read: true
                            });
                        }
                    });
                });
            
            return () => {
                clearTimeout(initialCheckTimeout);
                clearInterval(interval);
                unsubscribeEvents();
            };
        }
    }, [currentUser]);

    const contextValue: CongratulationsContextType = {
        showCongratulations,
        hideCongratulations,
        checkForAchievements
    };

    return (
        <CongratulationsContext.Provider value={contextValue}>
            {children}
            <CongratulationsModal
                isOpen={congratulations.isOpen}
                onClose={hideCongratulations}
                type={congratulations.type}
                data={congratulations.data}
            />
        </CongratulationsContext.Provider>
    );
};