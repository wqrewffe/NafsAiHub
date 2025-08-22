import React from 'react';
import StatCard from '../../components/StatCard';
import { DashboardStats } from '../../services/firebaseService';
import { UsersIcon, UserPlusIcon, ChartBarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

interface DashboardOverviewProps {
  stats: DashboardStats | null;
  loading: boolean;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading...
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={UsersIcon}
          trend={stats?.userGrowth || 0}
        />
        <StatCard
          title="Active Users"
          value={stats?.activeUsers || 0}
          icon={UserPlusIcon}
          trend={stats?.activeGrowth || 0}
        />
        <StatCard
          title="Total Tools Used"
          value={stats?.totalToolsUsed || 0}
          icon={ChartBarIcon}
          trend={stats?.toolGrowth || 0}
        />
        <StatCard
          title="Avg. Tools per User"
          value={stats?.avgToolsPerUser || 0}
          icon={ArrowTrendingUpIcon}
          trend={stats?.avgToolGrowth || 0}
        />
      </div>

      {/* Add other dashboard sections here */}
    </div>
  );
};

export default DashboardOverview;
