import React from 'react';
import './AvatarPicker.css';

const avatars = [
  { id: 'default', url: '/avatars/avatar1.png', name: 'Default' },
  { id: 'professional', url: '/avatars/avatar2.png', name: 'Professional' },
  { id: 'creative', url: '/avatars/avatar3.png', name: 'Creative' },
  { id: 'tech', url: '/avatars/avatar4.png', name: 'Tech' },
  { id: 'casual', url: '/avatars/avatar5.png', name: 'Casual' },
  { id: 'gamer', url: '/avatars/avatar6.png', name: 'Gamer' },
  { id: 'student', url: '/avatars/avatar7.png', name: 'Student' },
  { id: 'artist', url: '/avatars/avatar8.png', name: 'Artist' },
  { id: 'developer', url: '/avatars/avatar9.png', name: 'Developer' },
  { id: 'business', url: '/avatars/avatar10.png', name: 'Business' },
  { id: 'scientist', url: '/avatars/avatar11.png', name: 'Scientist' },
  { id: 'explorer', url: '/avatars/avatar12.png', name: 'Explorer' },
];

interface Props {
  currentAvatar?: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}

const AvatarPicker: React.FC<Props> = ({ currentAvatar, onSelect, onClose }) => {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50">
      <div className="flex items-start justify-center min-h-screen pt-24 px-4">
        <div 
          className="relative w-full max-w-2xl bg-secondary rounded-lg shadow-xl transform transition-all"
          style={{ maxHeight: 'calc(100vh - 150px)' }}
        >
          <div className="flex justify-between items-center p-6 sticky top-0 bg-secondary border-b border-primary/10">
            <h3 className="text-xl font-semibold text-light">Choose Your Avatar</h3>
            <button 
              onClick={onClose} 
              className="text-light/60 hover:text-light focus:outline-none focus:ring-2 focus:ring-primary rounded-full p-1"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-6 overflow-y-auto p-6 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 250px)' }}>
          {avatars.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => onSelect(avatar.url)}
              className={`relative p-3 rounded-xl transition-all flex flex-col items-center ${
                currentAvatar === avatar.url
                  ? 'ring-2 ring-primary bg-primary/10'
                  : 'hover:bg-primary/5'
              }`}
            >
              <div className="w-20 h-20 md:w-24 md:h-24 relative">
                <img
                  src={avatar.url}
                  alt={avatar.name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <p className="mt-2 text-sm text-light/90 text-center w-full truncate">{avatar.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
};

export default AvatarPicker;
