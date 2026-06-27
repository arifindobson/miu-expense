import { useTheme } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';
import LoginScreen from './components/LoginScreen';
import AuthedApp from './AuthedApp';

export default function App() {
  const { t } = useTheme();
  const auth = useAuth();

  if (auth.authLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-slate-100 p-0 sm:p-4 overflow-hidden">
        <div className={`flex flex-col items-center justify-center h-full w-full max-w-md mx-auto ${t.bg} font-sans ${t.textMain} border-x ${t.border} overflow-hidden shadow-2xl sm:h-[800px] sm:rounded-[2.5rem]`}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-slate-500">Loading Miu Expense...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <LoginScreen onLoginSuccess={auth.onLoginSuccess} />;
  }

  return <AuthedApp userId={auth.userId} userEmail={auth.userEmail} onLogout={auth.logout} />;
}
