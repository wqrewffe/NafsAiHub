
import React from 'react';
import { useAuth } from '../hooks/useAuth';

const ProfilePage: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-slate-400 mt-2">View your account information below.</p>
      </div>
      
      <div className="bg-secondary p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Account Details</h2>
        {currentUser ? (
           <div className="space-y-3">
                 {currentUser.displayName && (
                    <p className="text-slate-300">
                        <strong className="font-medium text-slate-100">Full Name:</strong> {currentUser.displayName}
                    </p>
                )}
                <p className="text-slate-300">
                    <strong className="font-medium text-slate-100">Email:</strong> {currentUser.email}
                </p>
                <p className="text-slate-300">
                    <strong className="font-medium text-slate-100">User ID:</strong> <span className="text-xs font-mono">{currentUser.uid}</span>
                </p>
           </div>
        ) : (
            <p className="text-slate-400">Could not load user information.</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;