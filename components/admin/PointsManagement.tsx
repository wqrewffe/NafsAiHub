import React, { useState } from 'react';
import { givePointsToUser } from '../../services/adminService';
import { FirestoreUser } from '../../types';
import { auth, db } from '../../firebase/config';
import { useCongratulations } from '../../hooks/CongratulationsProvider';

interface PointsManagementProps {
  user: FirestoreUser;
  onPointsUpdated: () => void;
}

const PointsManagement: React.FC<PointsManagementProps> = ({ user, onPointsUpdated }) => {
  const [points, setPoints] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { showCongratulations } = useCongratulations();

  const handleGivePoints = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    const numPoints = parseInt(points);
    if (isNaN(numPoints)) {
      setError('Please enter a valid number');
      setLoading(false);
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('Admin not authenticated');
        return;
      }

      // Debug: Log user IDs
      console.log('Current admin user:', {
        adminUid: currentUser.uid,
        adminEmail: currentUser.email
      });
      console.log('Target user:', {
        uid: user.uid,
        id: user.id,
        email: user.email
      });

      // Try to give points using the most reliable identifier
      const targetUserId = user.uid || user.id;
      if (!targetUserId) {
        setError('Invalid user ID');
        setLoading(false);
        return;
      }
      
      console.log('Attempting to give points:', {
        adminId: currentUser.uid,
        targetUserId,
        numPoints
      });

      const result = await givePointsToUser(currentUser.uid, targetUserId, numPoints);
      console.log('Points award result:', result);
      
      if (result.success) {
        const message = `Successfully awarded ${numPoints} points to ${user.displayName || user.email}. New total: ${result.newTotal} points`;
        console.log(message);
        setSuccess(message);
        setPoints('');
        onPointsUpdated();
      } else {
        setError(result.error || 'Failed to give points');
      }
    } catch (err) {
      setError('An error occurred while giving points');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Manage Points</h3>
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Points to Give
          </label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded-md w-32"
            placeholder="Enter points"
            min="0"
          />
        </div>
        <button
          onClick={handleGivePoints}
          disabled={loading || !points}
          className={`mt-6 px-4 py-2 rounded-md ${
            loading || !points
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {loading ? 'Giving...' : 'Give Points'}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-red-500 text-sm">{error}</p>
      )}
      {success && (
        <p className="mt-2 text-green-500 text-sm">{success}</p>
      )}
      <div className="mt-4 text-sm text-gray-400">
        Current Points: {user.points || 0}
      </div>
    </div>
  );
};

export default PointsManagement;
