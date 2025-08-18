
import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { auth } from '../firebase/config';


const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await auth.sendPasswordResetEmail(email);
      setMessage('Password reset link sent! Please check your inbox and spam folder.');
    } catch (err: any) {
      setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="max-w-md w-full bg-secondary p-8 rounded-lg shadow-lg">
        {message ? (
          <div className="text-center">
            <p className="bg-green-500/20 text-green-400 p-3 rounded-md mb-4">{message}</p>
            <ReactRouterDOM.Link to="/login" className="w-full mt-4 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent btn-animated">
              Back to Login
            </ReactRouterDOM.Link>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-center text-light mb-8">Reset Password</h2>
            {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-md mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full mt-1 px-3 py-2 bg-primary border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent btn-animated disabled:bg-slate-500"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-400">
              Remember your password?{' '}
              <ReactRouterDOM.Link to="/login" className="font-medium text-accent hover:text-sky-400">
                Login
              </ReactRouterDOM.Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
