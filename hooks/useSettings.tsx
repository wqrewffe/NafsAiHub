
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { db } from '../firebase/config';

interface AuthSettings {
  isGoogleAuthDisabled: boolean;
}

interface SettingsContextType {
  authSettings: AuthSettings;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authSettings, setAuthSettings] = useState<AuthSettings>({ isGoogleAuthDisabled: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const settingsRef = db.collection('settings').doc('auth');
    const unsubscribe = settingsRef.onSnapshot(doc => {
      if (doc.exists) {
        setAuthSettings(doc.data() as AuthSettings);
      } else {
        // Default settings if document doesn't exist
        setAuthSettings({ isGoogleAuthDisabled: false });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching settings: ", error);
      setAuthSettings({ isGoogleAuthDisabled: false });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <SettingsContext.Provider value={{ authSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};