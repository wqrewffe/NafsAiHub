
import React from 'react';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  loading: boolean;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, loading, description }) => {
  return (
    <div className="bg-secondary p-4 rounded-lg shadow-md flex items-start space-x-4">
      <div className="bg-primary p-3 rounded-lg flex-shrink-0">
        <Icon className="h-6 w-6 text-accent" />
      </div>
      <div className="flex-grow">
        <p className="text-sm text-slate-400">{title}</p>
        {loading ? (
          <div className="h-8 w-16 bg-slate-700 rounded-md animate-pulse mt-1"></div>
        ) : (
          <p className="text-3xl font-bold text-light">{value}</p>
        )}
        {description && !loading && (
             <p className="text-xs text-slate-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};

export default StatCard;