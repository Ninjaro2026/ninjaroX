import React, { useState } from 'react';
import { loginUser, registerUser } from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const user = await loginUser({ email, password });
        onSuccess(user);
        onClose();
      } else {
        const user = await registerUser({ name, email, password });
        onSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-emerald-950/40 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 bg-white/90 backdrop-blur-2xl w-full max-w-md rounded-[2.5rem] border border-emerald-900/10 shadow-2xl p-8 md:p-10 animate-in zoom-in-95 duration-200 font-poppins text-emerald-950">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-emerald-950/5 hover:bg-emerald-950 hover:text-white flex items-center justify-center text-emerald-950/50 transition-all active:scale-95"
          aria-label="Close auth modal"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-limelight text-3xl md:text-4xl text-emerald-950 tracking-tight uppercase">
              {isLogin ? 'Welcome Back' : 'Join Ninjaro'}
            </h2>
            <p className="text-xs text-emerald-900/50 uppercase tracking-widest font-black">
              {isLogin ? 'Enter your credentials to continue' : 'Create an account to start state-shifting'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200/50 text-red-600 px-4 py-3 rounded-2xl text-xs font-semibold text-center animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40 pl-2 block">Name</label>
                <input 
                  type="text"
                  required
                  placeholder="Your Full Name"
                  className="w-full bg-emerald-950/5 border border-emerald-900/10 rounded-2xl px-5 py-3.5 text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40 pl-2 block">Email Address</label>
              <input 
                type="email"
                required
                placeholder="your.email@example.com"
                className="w-full bg-emerald-950/5 border border-emerald-900/10 rounded-2xl px-5 py-3.5 text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40 pl-2 block">Password</label>
              <input 
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-emerald-950/5 border border-emerald-900/10 rounded-2xl px-5 py-3.5 text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-emerald-950 text-white font-black tracking-widest uppercase text-xs hover:bg-emerald-900 active:scale-[0.98] transition-all shadow-xl shadow-emerald-950/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Loading...</span>
              ) : (
                <>
                  <span>{isLogin ? 'Log In' : 'Sign Up'}</span>
                  <span className="material-symbols-outlined text-sm">login</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs border-t border-emerald-950/5">
            <span className="text-emerald-900/50 font-medium">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button 
              onClick={() => {
                setError('');
                setIsLogin(!isLogin);
              }}
              className="text-emerald-900 font-black uppercase tracking-wider hover:underline ml-1"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
