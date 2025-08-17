
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import { auth, googleProvider } from '../firebase/config';
import { createUserProfileDocument } from '../services/firebaseService';
import { GoogleIcon } from '../tools/Icons';
import { useSettings } from '../hooks/useSettings';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { authSettings, loading: settingsLoading } = useSettings();

  const setAuthPersistence = async () => {
    const persistence = rememberMe
      ? firebase.auth.Auth.Persistence.LOCAL
      : firebase.auth.Auth.Persistence.SESSION;
    await auth.setPersistence(persistence);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await setAuthPersistence();
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      if (userCredential.user && !userCredential.user.emailVerified) {
        await auth.signOut();
        setError('Please verify your email to log in. Check your inbox (and spam folder).');
        setLoading(false);
        return;
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
        await setAuthPersistence();
        const userCredential = await auth.signInWithPopup(googleProvider);
        if (userCredential.user) {
            await createUserProfileDocument(userCredential.user);
        }
        navigate('/');
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="max-w-md w-full bg-secondary p-6 sm:p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-light mb-8">Login</h2>
        {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={handleEmailSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 bg-primary border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 bg-primary border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-accent bg-primary border-slate-600 rounded focus:ring-accent"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-300">
                Remember me for 30 days
              </label>
            </div>
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-accent hover:text-sky-400">
                Forgot Password?
              </Link>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent btn-animated disabled:bg-slate-500"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {!settingsLoading && !authSettings.isGoogleAuthDisabled && (
          <>
            <div className="my-6 flex items-center">
                <div className="flex-grow border-t border-slate-600"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-sm">OR</span>
                <div className="flex-grow border-t border-slate-600"></div>
            </div>

            <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex justify-center items-center gap-3 py-2 px-4 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-300 bg-primary hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 btn-animated disabled:bg-slate-700"
            >
                <GoogleIcon className="h-5 w-5" />
                Sign in with Google
            </button>
          </>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-accent hover:text-sky-400">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;