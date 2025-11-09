
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { db } from '../firebase/config';

interface AuthSettings {
  isGoogleAuthDisabled: boolean;
  featureFlags?: {
    hideLeaderboard?: boolean;
    hideSupportAdditionalResources?: boolean;
    hideNavbarLeaderboard?: boolean;
    hideNavbarBadges?: boolean;
    hideNavbarReferral?: boolean;
    hideNavbarSupport?: boolean;
    hideNavbarContact?: boolean;
    hideSupportQuickEmail?: boolean;
    hideSupportQuickChat?: boolean;
    hideSupportQuickDocs?: boolean;
    hideSupportFAQGeneral?: boolean;
    hideSupportFAQAiTools?: boolean;
    hideSupportFAQReferral?: boolean;
    hideSupportFAQTechnical?: boolean;
    hideBadgesReferralSection?: boolean;
    hideBadgesToolUsageSection?: boolean;
    hideBadgesUnlockedSection?: boolean;
    hideContactAdditionalMethods?: boolean;
    hideContactResponseTimes?: boolean;
    hidePoliciesPage?: boolean;
  };
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
        const data = doc.data() as AuthSettings;
        setAuthSettings({
          isGoogleAuthDisabled: !!data.isGoogleAuthDisabled,
          featureFlags: {
            hideLeaderboard: !!data.featureFlags?.hideLeaderboard,
            hideSupportAdditionalResources: !!data.featureFlags?.hideSupportAdditionalResources,
            hideNavbarLeaderboard: !!data.featureFlags?.hideNavbarLeaderboard,
            hideNavbarBadges: !!data.featureFlags?.hideNavbarBadges,
            hideNavbarReferral: !!data.featureFlags?.hideNavbarReferral,
            hideNavbarSupport: !!data.featureFlags?.hideNavbarSupport,
            hideNavbarContact: !!data.featureFlags?.hideNavbarContact,
            hideSupportQuickEmail: !!data.featureFlags?.hideSupportQuickEmail,
            hideSupportQuickChat: !!data.featureFlags?.hideSupportQuickChat,
            hideSupportQuickDocs: !!data.featureFlags?.hideSupportQuickDocs,
            hideSupportFAQGeneral: !!data.featureFlags?.hideSupportFAQGeneral,
            hideSupportFAQAiTools: !!data.featureFlags?.hideSupportFAQAiTools,
            hideSupportFAQReferral: !!data.featureFlags?.hideSupportFAQReferral,
            hideSupportFAQTechnical: !!data.featureFlags?.hideSupportFAQTechnical,
            hideBadgesReferralSection: !!data.featureFlags?.hideBadgesReferralSection,
            hideBadgesToolUsageSection: !!data.featureFlags?.hideBadgesToolUsageSection,
            hideBadgesUnlockedSection: !!data.featureFlags?.hideBadgesUnlockedSection,
            hideContactAdditionalMethods: !!data.featureFlags?.hideContactAdditionalMethods,
            hideContactResponseTimes: !!data.featureFlags?.hideContactResponseTimes,
            hidePoliciesPage: !!data.featureFlags?.hidePoliciesPage,
          }
        });
      } else {
        setAuthSettings({ isGoogleAuthDisabled: false, featureFlags: {} });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching settings: ", error);
      setAuthSettings({ isGoogleAuthDisabled: false, featureFlags: {} });
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