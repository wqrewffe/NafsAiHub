import React, { createContext, useContext, useState } from 'react';

interface Notification {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

interface CongratulationsContextType {
  showCongratulations: (notification: Notification) => void;
  currentNotification: Notification | null;
  isOpen: boolean;
  closeModal: () => void;
}

const CongratulationsContext = createContext<CongratulationsContextType | undefined>(undefined);

export const CongratulationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const showCongratulations = (notification: Notification) => {
    setCurrentNotification(notification);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    if (currentNotification?.onClose) {
      currentNotification.onClose();
    }
    setCurrentNotification(null);
  };

  return (
    <CongratulationsContext.Provider value={{ showCongratulations, currentNotification, isOpen, closeModal }}>
      {children}
    </CongratulationsContext.Provider>
  );
};

export const useCongratulations = () => {
  const context = useContext(CongratulationsContext);
  if (!context) {
    throw new Error('useCongratulations must be used within a CongratulationsProvider');
  }
  return context;
};

// Helper functions
export const createPointsNotification = (userId: string, points: number, source: string) => {
  return {
    title: 'Points Added!',
    message: `You received ${points} points from ${source}!`,
    type: 'success' as const
  };
};

export const createToolUnlockNotification = (toolName: string) => {
  return {
    title: 'Tool Unlocked!',
    message: `You have unlocked ${toolName}!`,
    type: 'success' as const
  };
};

export const createToolMasteryNotification = (toolName: string, level: string) => {
  return {
    title: 'Mastery Level Up!',
    message: `You've reached ${level} mastery with ${toolName}!`,
    type: 'success' as const
  };
};

export const createBadgeNotification = (badgeName: string) => {
  return {
    title: 'New Badge Earned!',
    message: `Congratulations! You've earned the ${badgeName} badge!`,
    type: 'success' as const
  };
};

export const createReferralNotification = (points: number) => {
  return {
    title: 'Referral Bonus!',
    message: `You earned ${points} points from a referral!`,
    type: 'success' as const
  };
};