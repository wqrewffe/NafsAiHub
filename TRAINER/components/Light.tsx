
import React from 'react';

interface LightProps {
  isOn: boolean;
}

const Light: React.FC<LightProps> = ({ isOn }) => {
  const baseClasses = "w-12 h-12 md:w-16 md:h-16 rounded-full transition-all duration-200 ease-in-out";
  const onClasses = "bg-red-500 shadow-glow-red";
  const offClasses = "bg-gray-800 border-2 border-gray-700";

  return <div className={`${baseClasses} ${isOn ? onClasses : offClasses}`}></div>;
};

export default Light;
