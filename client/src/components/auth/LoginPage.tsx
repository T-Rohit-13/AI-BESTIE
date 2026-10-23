import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Lock, User, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [username, setUsername] = useState<string>('demo_user');
  const [password, setPassword] = useState<string>('Password123!');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const redirectUrl = searchParams.get('redirect') || '/';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      login('mock_jwt_token_auth_valid', {
        id: 'usr_authenticated_01',
        username: username.trim(),
        fullName: username.trim(),
      });
      setIsLoading(false);
      navigate(redirectUrl);
    }, 600);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md inaro-card p-6 sm:p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white mx-auto mb-3 shadow-md shadow-purple-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign In to INARO</h1>
          <p className="text-xs text-slate-500 mt-1">
            Access your empathetic companions and private space
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-username" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Username or Mobile Number
            </label>
            <div className="relative">
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-purple-50/40 border border-purple-200/80 rounded-xl text-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-purple-50/40 border border-purple-200/80 rounded-xl text-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 transition cursor-pointer mt-2"
          >
            {isLoading ? 'Signing In...' : 'Continue'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center mt-6">
          INARO adheres to strict session privacy standards. Credentials are encrypted and never logged.
        </p>
      </div>
    </div>
  );
};
