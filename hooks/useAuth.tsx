import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import firebase from 'firebase/compat/app';
import { auth } from '../firebase/config';
import { fetchPublicIp, setUserIp, isIpBlocked, setUserPresenceHeartbeat, setUserOffline, logUserAccess, logPageView } from '../services/firebaseService';
import { db } from '../firebase/config';
import Spinner from '../components/Spinner';

interface AuthContextType {
  currentUser: firebase.User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ipBlocked, setIpBlocked] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;
    let presenceInterval: any = null;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && auth.currentUser) {
        setUserPresenceHeartbeat(auth.currentUser.uid).catch(() => {});
        try {
          logPageView({ userId: auth.currentUser.uid, path: window.location.pathname, userAgent: (navigator as any)?.userAgent || null }).catch(() => {});
        } catch (e) {}
      }
    };

    const handleBeforeUnload = () => {
      if (auth.currentUser) {
        // best-effort synchronous navigator.sendBeacon could be used here but keeping simple
        setUserOffline(auth.currentUser.uid).catch(() => {});
      }
    };

    (async () => {
      try {
        const ip = await fetchPublicIp();
        if (ip) {
          const blocked = await isIpBlocked(ip);
          if (mounted && blocked) {
            setIpBlocked(true);
            setLoading(false);
            return; // don't continue with auth subscription
          }
        }
      } catch (e) {
        console.warn('Failed to check IP block status', e);
      }

      unsubscribe = auth.onAuthStateChanged((user) => {
        setCurrentUser(user);
        setLoading(false);

        // Best-effort: persist the user's public IP into their Firestore profile
        if (user) {
          (async () => {
            try {
              const ip = await fetchPublicIp();
              if (ip) await setUserIp(user.uid, ip);
              // start presence heartbeat
              setUserPresenceHeartbeat(user.uid).catch(() => {});
              if (presenceInterval) clearInterval(presenceInterval);
              presenceInterval = setInterval(() => {
                setUserPresenceHeartbeat(user.uid).catch(() => {});
              }, 30 * 1000);
              // log sign-in access
              try {
                const ua = typeof navigator !== 'undefined' ? navigator.userAgent : null;
                await logUserAccess(user.uid, { ip: ip || null, userAgent: ua, platform: (navigator as any)?.platform || null, locale: (navigator as any)?.language || null, path: window.location.pathname });
              } catch (e) { console.warn('failed to log user access', e); }
              // hook visibility and unload events
              document.addEventListener('visibilitychange', handleVisibilityChange);
              window.addEventListener('beforeunload', handleBeforeUnload);
              // log initial page view
              try {
                await logPageView({ userId: user.uid, ip: ip || null, path: window.location.pathname, userAgent: (navigator as any)?.userAgent || null });
              } catch (e) { console.warn('failed to log page view', e); }
              // Enforce server-side soft session revoke: check sessionRevokedAt
              try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                const data = userDoc.data() || {};
                const revoked = data.sessionRevokedAt;
                if (revoked) {
                  const revokedMs = revoked.toDate ? revoked.toDate().getTime() : (revoked.seconds ? revoked.seconds * 1000 : 0);
                  // Use lastSignInTime (auth metadata) to compare
                  const authTime = (user.metadata && user.metadata.lastSignInTime) ? new Date(user.metadata.lastSignInTime).getTime() : 0;
                  if (authTime && authTime < revokedMs) {
                    // Force sign out locally
                    await auth.signOut();
                  }
                }
              } catch (e) {
                console.warn('Failed to check sessionRevokedAt', e);
              }
            } catch (err) {
              console.warn('Failed to persist user IP on auth change', err);
            }
          })();
        } else {
          // user signed out: cleanup presence and intervals
          if (presenceInterval) { clearInterval(presenceInterval); presenceInterval = null; }
          if (currentUser) {
            setUserOffline(currentUser.uid).catch(() => {});
          }
        }
      });
    })();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
      try {
        if (presenceInterval) { clearInterval(presenceInterval); presenceInterval = null; }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      } catch (e) {}
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary">
        <Spinner />
      </div>
    );
  }

  if (ipBlocked) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary text-center p-6">
        <div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">Access blocked</h2>
          <p className="text-slate-300 mb-4">Your IP has been blocked by the site administrator. If you believe this is a mistake, contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
