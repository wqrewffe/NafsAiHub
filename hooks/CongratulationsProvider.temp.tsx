import React, { createContext, useContext, useState } from 'react';
import { Badge } from '../types';
import CongratulationsModal from '../components/CongratulationsModal';

interface Notification {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
  action?: {
    type: 'navigate' | 'share' | 'try_tool' | 'invite' | 'claim';
    destination?: string;
    toolId?: string;
  };
  reward?: {
    type: 'xp' | 'points' | 'feature' | 'badge';
    amount?: number;
    item?: string;
  };
  badge?: Badge;
  points?: number;
  level?: string;
  toolName?: string;
  cost?: number;
  currentPoints?: number;
}

interface CongratulationsContextType {
  showCongratulations: (notification: Notification) => void;
  currentNotification: Notification | null;
  isOpen: boolean;
  closeModal: () => void;
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

  const value = {
    isOpen,
    currentNotification,
    showCongratulations,
    closeModal
  };

  return (
    <CongratulationsContext.Provider value={value}>
      {children}
      <CongratulationsModal
        isOpen={isOpen}
        onClose={closeModal}
        type={currentNotification?.type === 'success' ? 'success' : currentNotification?.type === 'error' ? 'error' : 'success'}
        data={{
          message: currentNotification?.message,
          badge: currentNotification?.badge,
          points: currentNotification?.points,
          level: currentNotification?.level,
          toolId: currentNotification?.action?.toolId,
          redirectTo: currentNotification?.action?.destination
        }}
      />
    </CongratulationsContext.Provider>
  );
};

export default CongratulationsProvider;
