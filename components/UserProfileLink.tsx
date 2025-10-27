import React from 'react';
import { Link } from 'react-router-dom';

interface UserProfileLinkProps {
  displayName: string;
  uid: string;
  className?: string;
}

const UserProfileLink: React.FC<UserProfileLinkProps> = ({ displayName, uid, className = '' }) => {
  const profileUrl = `/profile/${displayName}-${uid}`;
  
  return (
    <Link to={profileUrl} className={`hover:underline ${className}`}>
      {displayName}
    </Link>
  );
};

export default UserProfileLink;
