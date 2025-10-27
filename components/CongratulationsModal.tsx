import React, { useEffect, useState } from 'react';
import { Badge } from '../types';

interface CongratulationsModalProps {
    isOpen: boolean;
    onClose: () => void;
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

const CongratulationsModal: React.FC<CongratulationsModalProps> = ({ 
    isOpen, 
    onClose, 
    type, 
    data 
}) => {
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAction = () => {
        if (data.redirectTo) {
            window.location.href = `/#${data.redirectTo}`;
        } else if (data.toolId) {
            window.location.href = `/#/tool/${data.toolId}`;
        }
        onClose();
    };

    const getTitle = () => {
        if (data.title) {
            return data.title;
        }
        switch (type) {
            case 'badge':
                return '🎉 New Badge Unlocked!';
            case 'points':
                return '🎉 Points Earned!';
            case 'level':
                return '🎉 Level Up!';
            case 'success':
                return '🎉 Success!';
            case 'error':
                return '⚠️ Attention!';
            default:
                return '🎉 Congratulations!';
        }
    };

    const getContent = () => {
        switch (type) {
            case 'badge':
                return (
                    <div className="text-center">
                        <div className="mb-6">
                            <img 
                                src={data.badge?.imageUrl} 
                                alt={data.badge?.name}
                                className="w-24 h-24 mx-auto mb-4 animate-bounce"
                            />
                            <h3 className="text-2xl font-bold text-primary mb-2">
                                {data.badge?.name}
                            </h3>
                            <p className="text-slate-300 mb-4">
                                {data.badge?.description}
                            </p>
                        </div>
                    </div>
                );
            case 'points':
                return (
                    <div className="text-center">
                        <div className="mb-6">
                            <div className="text-6xl mb-4">💰</div>
                            <h3 className="text-2xl font-bold text-primary mb-2">
                                +{data.points} Points!
                            </h3>
                            <p className="text-slate-300">
                                {data.message || 'Great job! Keep up the excellent work!'}
                            </p>
                        </div>
                    </div>
                );
            case 'level':
                return (
                    <div className="text-center">
                        <div className="mb-6">
                            <div className="text-6xl mb-4">⭐</div>
                            <h3 className="text-2xl font-bold text-primary mb-2">
                                Level {data.level}!
                            </h3>
                            <p className="text-slate-300">
                                {data.message || 'You\'ve reached a new milestone!'}
                            </p>
                        </div>
                    </div>
                );
            case 'success':
            case 'error':
                const icon = type === 'success' ? '🎉' : '⚠️';
                const buttonText = data.toolId ? 'Try it' : data.redirectTo ? 'Learn More' : 'OK';
                const buttonClass = type === 'success' ? 'bg-green-500' : 'bg-yellow-500';
                
                return (
                    <div className="text-center">
                        <div className="mb-6">
                            <div className="text-6xl mb-4">{icon}</div>
                            <h3 className="text-2xl font-bold text-primary mb-2">
                                {data.message}
                            </h3>
                            <button 
                                onClick={handleAction}
                                className={`mt-4 px-6 py-2 rounded-lg text-white ${buttonClass} hover:opacity-90`}
                            >
                                {buttonText}
                            </button>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="text-center">
                        <div className="mb-6">
                            <div className="text-6xl mb-4">🎊</div>
                            <p className="text-slate-300">
                                {data.message || 'Congratulations on your achievement!'}
                            </p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[100] fade-in backdrop-blur-sm"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            {/* Confetti effect */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-ping"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${1 + Math.random() * 2}s`,
                            }}
                        >
                            {['🎉', '🎊', '⭐', '💫', '🌟', '✨'][Math.floor(Math.random() * 6)]}
                        </div>
                    ))}
                </div>
            )}

            <div 
                className="bg-secondary rounded-lg shadow-xl w-full max-w-md mx-4 scale-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 text-center">
                    <h2 className="text-2xl font-bold text-light mb-4">
                        {getTitle()}
                    </h2>
                    
                    {getContent()}

                    {/* Only show Awesome button for non-error messages */}
                    {type !== 'error' && (
                        <button 
                            onClick={onClose}
                            className="bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
                        >
                            Awesome!
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CongratulationsModal;
