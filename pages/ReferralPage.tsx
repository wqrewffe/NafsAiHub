import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getReferralInfo, getReferralUrl } from '../services/referralService';
import { FirestoreUser } from '../types';
import { CheckCircleIcon, ShareIcon } from '../tools/Icons';

const ReferralPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [referralInfo, setReferralInfo] = useState<NonNullable<FirestoreUser['referralInfo']> | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const loadReferralInfo = async () => {
            if (currentUser) {
                const info = await getReferralInfo(currentUser.uid);
                setReferralInfo(info);
            }
        };
        loadReferralInfo();
    }, [currentUser]);

    const handleCopyLink = async () => {
        if (referralInfo) {
            const referralUrl = getReferralUrl(referralInfo.referralCode);
            await navigator.clipboard.writeText(referralUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!referralInfo) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Refer Friends & Earn Rewards</h1>
                    <p className="text-slate-400 mt-2">
                        Share your unique referral link with friends. When they sign up, you'll both earn rewards!
                    </p>
                </div>

                {/* Referral Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-secondary p-6 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">Total Referrals</h3>
                        <p className="text-3xl font-bold">{referralInfo.referralsCount}</p>
                    </div>
                    <div className="bg-secondary p-6 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">Rewards Earned</h3>
                        <p className="text-3xl font-bold">{referralInfo.rewards} points</p>
                    </div>
                    <div className="bg-secondary p-6 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">Referral Code</h3>
                        <p className="text-3xl font-bold font-mono">{referralInfo.referralCode}</p>
                    </div>
                </div>

                {/* Referral Link */}
                <div className="bg-secondary p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">Share Your Referral Link</h2>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            readOnly
                            value={getReferralUrl(referralInfo.referralCode)}
                            className="flex-1 bg-gray-700 rounded px-4 py-2 font-mono text-sm"
                        />
                        <button
                            onClick={handleCopyLink}
                            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
                        >
                            {copied ? (
                                <>
                                    <CheckCircleIcon className="w-5 h-5" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <ShareIcon className="w-5 h-5" />
                                    Copy Link
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Referral History */}
                {referralInfo.referralHistory.length > 0 && (
                    <div className="bg-secondary p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4">Referral History</h2>
                        <div className="space-y-4">
                            {referralInfo.referralHistory.map((history, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-gray-700 rounded"
                                >
                                    <div>
                                        <p className="font-medium">{history.referredUserEmail}</p>
                                        <p className="text-sm text-slate-400">
                                            {new Date(history.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-green-400">+100 points</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReferralPage;
