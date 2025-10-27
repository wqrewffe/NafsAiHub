import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

export interface ReferralInfo {
    referralCode: string;
    referralsCount: number;
    referredBy?: string;
    rewards: number;
    referralHistory: ReferralHistoryItem[];
}

export interface ReferralHistoryItem {
    referredUserId: string;
    referredUserEmail: string;
    timestamp: firebase.firestore.Timestamp;
    rewardClaimed: boolean;
}

export interface ReferralReward {
    referralsNeeded: number;
    rewardAmount: number;
    description: string;
}
