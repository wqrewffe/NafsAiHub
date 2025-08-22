import React from 'react';
import { AdminDashboard } from '../../components/AdminDashboard';
import Layout from '../../components/Layout';
import AdminRoute from '../../components/AdminRoute';

const AdminPage: React.FC = () => {
    return (
        <AdminRoute>
            <Layout>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                    <AdminDashboard />
                </div>
            </Layout>
        </AdminRoute>
    );
};

export default AdminPage;
