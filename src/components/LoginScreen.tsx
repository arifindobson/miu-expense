import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginScreenProps {
  onLoginSuccess: (uid: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (authError) {
          setError(authError.message);
          setIsLoading(false);
          return;
        }

        if (data?.user) {
          // Store "keep me logged in" preference
          if (keepLoggedIn) {
            localStorage.setItem('miu_keep_logged_in', 'true');
          } else {
            localStorage.removeItem('miu_keep_logged_in');
          }
          onLoginSuccess(data.user.id);
        }
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });

        if (authError) {
          setError(authError.message);
          setIsLoading(false);
          return;
        }

        if (data?.user) {
          // Check if email confirmation is needed
          if (data.session) {
            // Auto-confirmed (e.g. in development mode)
            if (keepLoggedIn) {
              localStorage.setItem('miu_keep_logged_in', 'true');
            }
            onLoginSuccess(data.user.id);
          } else {
            setSuccessMessage('Account created! Please check your email to verify your account, then sign in.');
            setMode('login');
            setPassword('');
          }
        }
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-0 sm:p-4">
      <div className="flex flex-col h-full w-full max-w-md mx-auto bg-white font-sans border-x border-slate-200 overflow-hidden shadow-2xl sm:h-[800px] sm:rounded-[2.5rem] relative">
        
        {/* Gradient Header */}
        <div className="relative overflow-hidden pt-safe">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
          
          <div className="relative z-10 px-8 pt-12 pb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <span className="text-white/80 font-bold text-sm tracking-wider uppercase">Miu Expense</span>
            </div>
            
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-white/60 text-sm mt-2 font-medium">
              {mode === 'login' 
                ? 'Sign in to continue tracking your finances' 
                : 'Start managing your expenses today'}
            </p>
          </div>

          {/* Curved bottom edge */}
          <div className="absolute -bottom-1 left-0 right-0">
            <svg viewBox="0 0 400 30" className="w-full h-auto fill-white">
              <path d="M0,30 C150,0 250,0 400,30 L400,30 L0,30 Z" />
            </svg>
          </div>
        </div>

        {/* Form Area */}
        <div className="flex-1 px-8 pt-4 pb-8 flex flex-col">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
            
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-2xl animate-in slide-in-from-top-2 duration-200">
                <span className="text-xs font-semibold text-rose-600">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl animate-in slide-in-from-top-2 duration-200">
                <span className="text-xs font-semibold text-emerald-600">{successMessage}</span>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">Email Address</label>
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm text-slate-900 placeholder:text-slate-400 min-w-0"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">Password</label>
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Min 6 characters' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm text-slate-900 placeholder:text-slate-400 min-w-0"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Keep Me Logged In */}
            {mode === 'login' && (
              <div className="flex items-center gap-3 px-1">
                <button
                  type="button"
                  onClick={() => setKeepLoggedIn(!keepLoggedIn)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                    keepLoggedIn 
                      ? 'bg-indigo-500 border-indigo-500' 
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {keepLoggedIn && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className="text-xs text-slate-500 font-medium">Keep me logged in</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Switch Mode */}
            <div className="text-center pb-4">
              <span className="text-xs text-slate-400">
                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
              </span>
              <button
                type="button"
                onClick={() => { 
                  setMode(mode === 'login' ? 'register' : 'login'); 
                  setError(null); 
                  setSuccessMessage(null); 
                }}
                className="text-xs font-bold text-indigo-500 hover:text-indigo-600 ml-1.5 transition-colors"
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
