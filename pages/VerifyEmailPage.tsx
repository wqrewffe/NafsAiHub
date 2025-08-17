import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../firebase/config';
import Spinner from '../components/Spinner';

const VerifyEmailPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleResend = async () => {
        if (!currentUser) {
            setError('You are not logged in. Please log in to resend verification email.');
            return;
        }
        setLoading(true);
        setError('');
        setMessage('');
        try {
            await currentUser.sendEmailVerification();
            setMessage('A new verification email has been sent. Please check your inbox and spam folder.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleLogout = async () => {
        await auth.signOut();
        navigate('/login');
    }

    return (
        <div className="flex items-center justify-center">
            <div className="max-w-lg w-full bg-secondary p-8 rounded-lg shadow-lg text-center">
                <h2 className="text-3xl font-bold text-light mb-4">Verify Your Email</h2>
                <p className="text-slate-300 mb-6">
                    A verification link has been sent to <strong className="text-accent">{currentUser?.email}</strong>. Please click the link to activate your account.
                </p>
                <p className="text-sm text-slate-400 mb-6">
                    Can't find the email? Be sure to check your spam or junk folder.
                </p>
                {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-md mb-4">{error}</p>}
                {message && <p className="bg-green-500/20 text-green-400 p-3 rounded-md mb-4">{message}</p>}
                <div className="space-y-4">
                     <button
                        onClick={handleResend}
                        disabled={loading}
                        className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent btn-animated disabled:bg-slate-500"
                    >
                        {loading ? <Spinner /> : 'Resend Verification Email'}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex justify-center items-center py-2 px-4 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;
