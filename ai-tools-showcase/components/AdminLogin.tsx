import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword } from '../firebase';

const ADMIN_EMAIL = 'nafisabdullah424@gmail.com';

const AdminLogin: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
      // On success, the onAuthStateChanged listener in App.tsx will handle the redirect.
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid credentials. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-lg shadow-2xl border border-border">
        <h1 className="text-3xl font-bold text-center text-accent mb-2">Admin Login</h1>
        <p className="text-center text-text-secondary mb-6">Access the AI Tools Showcase dashboard.</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">Email Address</label>
            <input 
              type="email" 
              id="email" 
              value={ADMIN_EMAIL}
              readOnly
              className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-text-secondary focus:outline-none" 
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">Password</label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" 
              required 
            />
          </div>
          
          {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-md text-sm">{error}</div>}

          <div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary hover:bg-secondary text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
