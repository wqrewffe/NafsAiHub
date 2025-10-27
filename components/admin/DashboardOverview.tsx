import React from "react";
import StatCard from "../../components/StatCard";
import { DashboardStats } from "../../services/firebaseService";
import {
  UsersIcon,
  UserPlusIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

interface DashboardOverviewProps {
  stats: DashboardStats | null;
  loading: boolean;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-600 text-lg">
        Loading dashboard...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 text-lg">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers ?? 0}
          icon={UsersIcon}
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers ?? 0}
          icon={UserPlusIcon}
        />
        <StatCard
          title="Total Tools Used"
          value={stats.totalToolsUsed ?? 0}
          icon={ChartBarIcon}
        />
        <StatCard
          title="Avg. Tools per User"
          value={stats.avgToolsPerUser ?? 0}
          icon={ArrowTrendingUpIcon}
        />
      </div>

      {/* 🚀 Add other dashboard sections below */}
    </div>
  );
};

export default DashboardOverview;
