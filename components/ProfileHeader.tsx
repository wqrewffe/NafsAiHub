import React, { useState } from 'react';
import AvatarSelector from './AvatarSelector';

interface ProfileHeaderProps {
  profile: any;
  isOwnProfile: boolean;
  selectedAvatar: string;
  onAvatarSelect: (avatarUrl: string) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isOwnProfile,
  selectedAvatar,
  onAvatarSelect,
}) => {
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  return (
    <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-4">
      <div className="flex flex-col items-center">
        <div className="relative group">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="w-24 h-24 rounded-full object-cover border-2 border-primary/50"
            />
          ) : profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              className="w-24 h-24 rounded-full object-cover border-2 border-primary/50"
            />
          ) : (
            <div 
              className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center border-2 border-primary/50 cursor-pointer"
              onClick={() => isOwnProfile && setShowAvatarSelector(!showAvatarSelector)}
            >
              <span className="text-4xl text-light">
                {profile.displayName?.[0].toUpperCase()}
              </span>
            </div>
          )}
          {isOwnProfile && (
            <button
              onClick={() => setShowAvatarSelector(!showAvatarSelector)}
              className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary/80 transition-colors"
              title="Change Avatar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          )}
        </div>
        {isOwnProfile && showAvatarSelector && (
          <div className="mt-4 w-full max-w-xs absolute z-10 bg-secondary rounded-lg shadow-xl border border-primary/20">
            <div className="p-2">
              <button 
                onClick={() => setShowAvatarSelector(false)}
                className="absolute top-2 right-2 text-light/60 hover:text-light"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <AvatarSelector
                selectedAvatar={selectedAvatar}
                onSelect={(avatarUrl) => {
                  onAvatarSelect(avatarUrl);
                  setShowAvatarSelector(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
      <div>
        <h1 className="text-2xl font-bold text-light">{profile.displayName}</h1>
        <p className="text-light/90 capitalize">{profile.role}</p>
        <p className="text-light/80 text-sm">
          Joined {new Date(profile.joinedDate).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default ProfileHeader;
