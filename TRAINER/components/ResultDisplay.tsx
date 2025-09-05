import React from 'react';

interface ResultDisplayProps {
  time: number;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ time }) => {
  const getRating = (ms: number): { text: string; color: string } => {
    if (ms < 150) return { text: 'Infinity Reflexes', color: 'text-green-400' };
    if (ms < 200) return { text: 'Excellent', color: 'text-green-500' };
    if (ms < 250) return { text: 'Great', color: 'text-yellow-400' };
    if (ms < 300) return { text: 'Good', color: 'text-yellow-500' };
    return { text: 'Average', color: 'text-orange-500' };
  };

  const rating = getRating(time);

  return (
    <div className="text-center animate-fade-in">
      <p className="text-xl text-gray-400">Your Reaction Time:</p>
      <p className="text-7xl md:text-9xl font-bold font-orbitron text-green-400 my-2">
        {time.toFixed(2)}
        <span className="text-3xl md:text-4xl ml-2">ms</span>
      </p>
      <p className={`text-xl font-semibold ${rating.color}`}>{rating.text}</p>
    </div>
  );
};

export default ResultDisplay;
