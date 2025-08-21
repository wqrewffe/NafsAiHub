import { db } from '../firebase/config';
import { FirestoreUser, ReferralInfo } from '../types';
import firebase from 'firebase/compat/app';
import { calculateBadges, calculateLevel } from './badgeService';

// Generate a unique referral code for a user
export const generateReferralCode = (userId: string): string => {
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${userId.substring(0, 6)}${randomStr}`;
};

// Initialize referral info and process referral
export async function initializeReferralInfo(userId: string, referralCode?: string): Promise<void> {
    console.log('Starting referral process for:', { userId, referralCode });
    
    if (!userId) throw new Error('User ID is required');
    
    const userRef = db.collection('users').doc(userId);

    try {
        const newUserDoc = await userRef.get();
        const newUserData = newUserDoc.data() as FirestoreUser;
        
        const { currentLevel, nextLevelPoints } = calculateLevel(0);
        const badges = calculateBadges(0);
        
        const newReferralInfo: ReferralInfo = {
            referralCode: generateReferralCode(userId),
            referralsCount: 0,
            referredBy: referralCode || null,
            rewards: 0,
            referralHistory: [],
            badges,
            level: currentLevel,
            nextLevelPoints,
            toolBadges: []
        };

        await userRef.update({ referralInfo: newReferralInfo });

        if (referralCode) {
            console.log('Processing referral code:', referralCode);
            
            const referrerQuery = await db.collection('users')
                .where('referralInfo.referralCode', '==', referralCode)
                .limit(1)
                .get();

            if (!referrerQuery.empty) {
                const referrerDoc = referrerQuery.docs[0];
                const referrerId = referrerDoc.id;

                if (referrerId === userId) {
                    throw new Error('Cannot refer yourself');
                }

                const newHistoryEntry = {
                    referredUserId: userId,
                    referredUserEmail: newUserData?.email || 'unknown',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    rewardClaimed: true
                };

                // Get current referrer data to calculate new badges and level
                const referrerData = await db.collection('users').doc(referrerId).get();
                const referrerInfo = referrerData.data()?.referralInfo;
                const newReferralsCount = (referrerInfo?.referralsCount || 0) + 1;
                
                // Calculate new badges and level
                const { currentLevel, nextLevelPoints } = calculateLevel(newReferralsCount);
                const badges = calculateBadges(newReferralsCount);

                await db.collection('users').doc(referrerId).update({
                    'referralInfo.referralsCount': firebase.firestore.FieldValue.increment(1),
                    'referralInfo.rewards': firebase.firestore.FieldValue.increment(100),
                    'referralInfo.referralHistory': firebase.firestore.FieldValue.arrayUnion(newHistoryEntry),
                    'referralInfo.badges': badges,
                    'referralInfo.level': currentLevel,
                    'referralInfo.nextLevelPoints': nextLevelPoints
                });

                await userRef.update({
                    'referralInfo.rewards': firebase.firestore.FieldValue.increment(50)
                });

                // Note: Congratulations will be triggered when the user next loads their profile
                // or uses tools, as the congratulations system checks for new achievements

                console.log('Successfully processed referral.');
            } else {
                console.log('No referrer found for code:', referralCode);
            }
        }
    } catch (error) {
        console.error('Error in referral process:', error);
        throw error;
    }
}

// Get referral info for a user
export const getReferralInfo = async (userId: string): Promise<ReferralInfo | null> => {
    if (!userId) throw new Error('User ID is required');

    try {
        console.log('Getting referral info for user:', userId);
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) return null;

        const userData = userDoc.data() as FirestoreUser;

        if (!userData.referralInfo) {
            const { currentLevel, nextLevelPoints } = calculateLevel(0);
            const badges = calculateBadges(0);
            
            const newReferralInfo: ReferralInfo = {
                referralCode: generateReferralCode(userId),
                referralsCount: 0,
                rewards: 0,
                referralHistory: [],
                referredBy: null,
                badges,
                level: currentLevel,
                nextLevelPoints,
                toolBadges: []
            };

            await db.collection('users').doc(userId).update({
                referralInfo: newReferralInfo
            });

            return newReferralInfo;
        }

        // Safely convert Firestore Timestamp or keep string
        const { currentLevel, nextLevelPoints } = calculateLevel(userData.referralInfo.referralsCount);
        const badges = calculateBadges(userData.referralInfo.referralsCount);
        
        const convertedReferralInfo: ReferralInfo = {
            ...userData.referralInfo,
            badges,
            level: currentLevel,
            nextLevelPoints,
            toolBadges: userData.referralInfo.toolBadges || [],
            referralHistory: userData.referralInfo.referralHistory.map(entry => {
                let timestampStr: string;
                const ts = entry.timestamp;
                if (ts && typeof ts === 'object' && 'toDate' in ts) {
                    timestampStr = (ts as firebase.firestore.Timestamp).toDate().toISOString();
                } else if (ts instanceof firebase.firestore.Timestamp) {
                    timestampStr = ts.toDate().toISOString();
                } else {
                    timestampStr = String(ts);
                }
                return { ...entry, timestamp: timestampStr };
            })
        };

        return convertedReferralInfo;

    } catch (error) {
        console.error('Error getting referral info:', error);
        throw error;
    }
};

// Get referral URL for sharing
export const getReferralUrl = (referralCode: string): string => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#/signup?ref=${referralCode}`;
};
