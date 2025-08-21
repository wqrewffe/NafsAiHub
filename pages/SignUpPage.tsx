
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { auth, googleProvider } from '../firebase/config';
import { createUserProfileDocument } from '../services/firebaseService';
import { initializeReferralInfo } from '../services/referralService';
import { GoogleIcon } from '../tools/Icons';
import { useSettings } from '../hooks/useSettings';

const SignUpPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = ReactRouterDOM.useNavigate();
  const { authSettings, loading: settingsLoading } = useSettings();
  const location = ReactRouterDOM.useLocation();

  // Get referral code from URL if present
  const referralCode = new URLSearchParams(location.search).get('ref');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!firstName || !lastName) {
      setError('Please enter your first and last name.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      if (userCredential.user) {
        await userCredential.user.updateProfile({
            displayName: `${firstName} ${lastName}`
        });
        // Create user profile first
        await createUserProfileDocument(userCredential.user, password);
        // Then handle referral
        await initializeReferralInfo(userCredential.user.uid, referralCode || undefined);
        await userCredential.user.sendEmailVerification();
        navigate('/verify-email');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
        setLoading(false);
    }
  };

   const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);
    try {
        const userCredential = await auth.signInWithPopup(googleProvider);
        if (userCredential.user) {
            // Create user profile first
            await createUserProfileDocument(userCredential.user);
            // Then handle referral
            await initializeReferralInfo(userCredential.user.uid, referralCode || undefined);
        }
        navigate('/'); // Google users are auto-verified, so they can go to home
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="max-w-md w-full bg-secondary p-6 sm:p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-light mb-8">Create an Account</h2>
        {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={handleEmailSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-300">First Name</label>
                <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full mt-1 px-3 py-2 bg-primary border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-300">Last Name</label>
                <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full mt-1 px-3 py-2 bg-primary border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
                />
            </div>
          </div>
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
              minLength={8}
              className="w-full mt-1 px-3 py-2 bg-primary border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
            />
          </div>
           <div>
            <label className="block text-sm font-medium text-slate-300">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full mt-1 px-3 py-2 bg-primary border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
            />
          </div>
          
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="terms"
              required
              className="mt-1 h-4 w-4 text-accent focus:ring-accent border-slate-600 rounded"
            />
            <label htmlFor="terms" className="text-sm text-slate-300">
              I agree to the{' '}
              <ReactRouterDOM.Link 
                to="/policies" 
                target="_blank"
                className="text-accent hover:text-sky-400 underline"
              >
                Terms of Service
              </ReactRouterDOM.Link>
              {' '}and{' '}
              <ReactRouterDOM.Link 
                to="/policies" 
                target="_blank"
                className="text-accent hover:text-sky-400 underline"
              >
                Privacy Policy
              </ReactRouterDOM.Link>
            </label>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent btn-animated disabled:bg-slate-500"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
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
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="w-full flex justify-center items-center gap-3 py-2 px-4 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-300 bg-primary hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 btn-animated disabled:bg-slate-700"
            >
                <GoogleIcon className="h-5 w-5" />
                Sign up with Google
            </button>
          </>
        )}
        
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <ReactRouterDOM.Link to="/login" className="font-medium text-accent hover:text-sky-400">
            Login
          </ReactRouterDOM.Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
