import React from 'react';

const avatarOptions = [
  {
    id: 'avatar1',
    url: '/avatars/avatar1.png',
    name: 'Default Avatar'
  },
  {
    id: 'avatar2',
    url: '/avatars/avatar2.png',
    name: 'Professional Avatar'
  },
  {
    id: 'avatar3',
    url: '/avatars/avatar3.png',
    name: 'Casual Avatar'
  },
  {
    id: 'avatar4',
    url: '/avatars/avatar4.png',
    name: 'Creative Avatar'
  },
  {
    id: 'avatar5',
    url: '/avatars/avatar5.png',
    name: 'Tech Avatar'
  },
  {
    id: 'avatar6',
    url: '/avatars/avatar6.png',
    name: 'Gamer Avatar'
  },
  {
    id: 'avatar7',
    url: '/avatars/avatar7.png',
    name: 'Student Avatar'
  },
  {
    id: 'avatar8',
    url: '/avatars/avatar8.png',
    name: 'Artist Avatar'
  },
  {
    id: 'avatar9',
    url: '/avatars/avatar9.png',
    name: 'Developer Avatar'
  },
  {
    id: 'avatar10',
    url: '/avatars/avatar10.png',
    name: 'Business Avatar'
  },
  {
    id: 'avatar11',
    url: '/avatars/avatar11.png',
    name: 'Scientist Avatar'
  },
  {
    id: 'avatar12',
    url: '/avatars/avatar12.png',
    name: 'Explorer Avatar'
  }
];

interface AvatarSelectorProps {
  selectedAvatar: string;
  onSelect: (avatarUrl: string) => void;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({ selectedAvatar, onSelect }) => {
  return (
    <div className="avatar-selector">
      <h3 className="text-xl font-semibold mb-4 text-light">Choose Your Avatar</h3>
      <div className="avatar-grid max-h-[400px] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {avatarOptions.map((avatar) => (
            <div
              key={avatar.id}
              className={`cursor-pointer p-3 rounded-lg transition-all transform hover:scale-105 ${
                selectedAvatar === avatar.url
                  ? 'border-2 border-primary bg-primary/10'
                  : 'border-2 border-secondary hover:border-primary/50 hover:bg-secondary/50'
              }`}
              onClick={() => {
                console.log('Selecting avatar:', avatar.url);
                onSelect(avatar.url);
              }}
            >
              <div className="aspect-square relative">
                <img
                  src={avatar.url}
                  alt={avatar.name}
                  className="rounded-full w-full h-full object-cover"
                />
              </div>
              <p className="text-center text-sm mt-2 text-light/90">{avatar.name}</p>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .avatar-selector {
          padding: 1.5rem;
          background: var(--background-secondary);
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }
        .avatar-grid::-webkit-scrollbar {
          width: 6px;
        }
        .avatar-grid::-webkit-scrollbar-track {
          background: var(--background-secondary);
          border-radius: 3px;
        }
        .avatar-grid::-webkit-scrollbar-thumb {
          background: var(--primary-color);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
};

export default AvatarSelector;
