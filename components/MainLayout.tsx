import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import ProgressPanel from './ProgressPanel';
import SocialFeed from './SocialFeed';
import EngagementBar from './EngagementBar';
import NotificationPopup from './NotificationPopup';
import { db } from '../firebase/config';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (currentUser) {
      const getUserData = async () => {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        setUserData(userDoc.data());
      };
      getUserData();
    }
  }, [currentUser]);

  console.log('MainLayout render:', { currentUser: !!currentUser, userData: !!userData });

  // Always render NotificationPopup in development
  const NotificationComponent = () => {
    console.log('Rendering NotificationPopup with auth state:', { 
      currentUser: currentUser?.uid,
      isLoggedIn: !!currentUser 
    });
    return <NotificationPopup />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationComponent />
      <div className="container mx-auto px-4 py-8">
        {currentUser && userData && (
          <EngagementBar
            streak={0}
            dailyReward={null}
            activeUsers={0}
            points={userData.points}
            isAdmin={userData.role === 'admin'}
          />
        )}
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Progress Panel */}
          {currentUser && (
            <div className="lg:w-1/4">
              <ProgressPanel />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {children}
          </div>

          {/* Right Sidebar - Social Feed */}
          {currentUser && (
            <div className="lg:w-1/3">
              <SocialFeed />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
