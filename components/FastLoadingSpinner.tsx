import React from 'react';

const FastLoadingSpinner: React.FC = () => {
  return (
    <div 
      style={{
        display: 'inline-block',
        width: '30px',
        height: '30px',
        border: '2px solid #f3f3f3',
        borderTop: '2px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 0.5s linear infinite',
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999
      }}
    />
  );
};

export default FastLoadingSpinner;