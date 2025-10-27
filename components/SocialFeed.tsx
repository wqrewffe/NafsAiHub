import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase/config';
import { 
  collection, query, where, orderBy, limit, 
  getDocs, doc, updateDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { UserCircleIcon, HeartIcon, ShareIcon } from '@heroicons/react/24/solid';

interface SharedResult {
  id: string;
  userId: string;
  userName: string;
  toolId: string;
  toolName: string;
  result: string;
  likes: number;
  timestamp: Date;
  liked?: boolean;
}

const SocialFeed: React.FC = () => {
  const { currentUser } = useAuth();
  const [sharedResults, setSharedResults] = useState<SharedResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSharedResults();
  }, []);

  const fetchSharedResults = async () => {
    try {
      const resultsRef = collection(db, 'sharedResults');
      const q = query(
        resultsRef,
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const results: SharedResult[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        // Check if current user has liked this result
        const liked = currentUser ? data.likedBy?.includes(currentUser.uid) : false;
        
        results.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate(),
          liked
        } as SharedResult);
      }

      setSharedResults(results);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching shared results:', error);
      setLoading(false);
    }
  };

  const handleLike = async (resultId: string) => {
    if (!currentUser) return;

    const resultRef = doc(db, 'sharedResults', resultId);
    const result = sharedResults.find(r => r.id === resultId);
    
    if (!result) return;

    try {
      if (result.liked) {
        await updateDoc(resultRef, {
          likes: result.likes - 1,
          likedBy: arrayRemove(currentUser.uid)
        });
      } else {
        await updateDoc(resultRef, {
          likes: result.likes + 1,
          likedBy: arrayUnion(currentUser.uid)
        });
      }

      // Update local state
      setSharedResults(prev => prev.map(r => {
        if (r.id === resultId) {
          return {
            ...r,
            likes: r.liked ? r.likes - 1 : r.likes + 1,
            liked: !r.liked
          };
        }
        return r;
      }));
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  const handleShare = async (resultId: string) => {
    try {
      const result = sharedResults.find(r => r.id === resultId);
      if (!result) return;

      await navigator.share({
        title: `${result.toolName} Result`,
        text: result.result,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Community Highlights</h2>
      {sharedResults.map(result => (
        <div key={result.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <UserCircleIcon className="h-10 w-10 text-gray-400" />
            <div className="ml-3">
              <p className="font-medium">{result.userName}</p>
              <p className="text-sm text-gray-500">
                Used {result.toolName} • {new Date(result.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-gray-800">{result.result}</p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleLike(result.id)}
              className={`flex items-center space-x-1 ${
                result.liked ? 'text-pink-500' : 'text-gray-500'
              } hover:text-pink-500 transition-colors`}
            >
              <HeartIcon className="h-5 w-5" />
              <span>{result.likes}</span>
            </button>
            
            <button
              onClick={() => handleShare(result.id)}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <ShareIcon className="h-5 w-5" />
              <span>Share</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SocialFeed;
