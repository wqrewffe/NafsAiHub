import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="h-16 w-16 flex items-center justify-center">
      {/* Simple CSS spinner */}
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
};

export default Spinner;
