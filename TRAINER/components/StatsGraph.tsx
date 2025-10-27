import React from 'react';

interface StatsGraphProps {
  reactionTimes: number[];
  avgTime: number;
}

const StatsGraph: React.FC<StatsGraphProps> = ({ reactionTimes, avgTime }) => {
  if (reactionTimes.length <= 1) {
    return null;
  }

  const width = 500;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };

  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const maxTime = Math.max(...reactionTimes, avgTime) * 1.1; // Add 10% buffer
  const minTime = Math.min(...reactionTimes) * 0.9; // Add 10% buffer

  const getX = (index: number) => {
    return padding.left + (index / (reactionTimes.length - 1)) * graphWidth;
  };

  const getY = (time: number) => {
    return padding.top + graphHeight - ((time - minTime) / (maxTime - minTime)) * graphHeight;
  };

  const linePath = reactionTimes
    .map((time, index) => `${getX(index)},${getY(time)}`)
    .join(' ');

  const avgLineY = getY(avgTime);
    
  return (
    <div className="w-full" aria-label="A line graph showing reaction time for each hit.">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-labelledby="graph-title">
        <title id="graph-title">Performance Over Time Graph</title>
        {/* Y-Axis Labels and Grid Lines */}
        <text x={padding.left - 8} y={padding.top + 5} textAnchor="end" className="text-sm fill-gray-400">{Math.round(maxTime)}ms</text>
        <line x1={padding.left} x2={width - padding.right} y1={padding.top} y2={padding.top} className="stroke-gray-700" strokeWidth="1" />

        <text x={padding.left - 8} y={getY(avgTime) + 4} textAnchor="end" className="text-sm fill-yellow-400">{Math.round(avgTime)}ms</text>
        <line x1={padding.left} x2={width - padding.right} y1={avgLineY} y2={avgLineY} className="stroke-yellow-500" strokeWidth="1" strokeDasharray="4" />

        <text x={padding.left - 8} y={height - padding.bottom + 5} textAnchor="end" className="text-sm fill-gray-400">{Math.round(minTime)}ms</text>
        <line x1={padding.left} x2={width - padding.right} y1={height - padding.bottom} y2={height - padding.bottom} className="stroke-gray-700" strokeWidth="1" />

        {/* X-Axis Labels */}
        <text x={padding.left} y={height - padding.bottom + 15} textAnchor="start" className="text-sm fill-gray-400">Hit 1</text>
        <text x={width - padding.right} y={height - padding.bottom + 15} textAnchor="end" className="text-sm fill-gray-400">Hit {reactionTimes.length}</text>

        {/* Axes */}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} className="stroke-gray-600" strokeWidth="2" />
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} className="stroke-gray-600" strokeWidth="2" />
        
        {/* Data Line */}
        <polyline
          fill="none"
          className="stroke-green-500"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={linePath}
        />
        
        {/* Data Points */}
        {reactionTimes.map((time, index) => (
          <circle
            key={index}
            cx={getX(index)}
            cy={getY(time)}
            r="3"
            className="fill-green-400"
          />
        ))}
      </svg>
    </div>
  );
};

export default StatsGraph;