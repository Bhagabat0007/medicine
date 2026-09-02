import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HeartPulse, Lock, User, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAuth } from '../store/useAuth';

const DEMO_CREDENTIALS = { username: 'admin', password: 'doctor123' };

export default function DoctorLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, token, user } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/doctor/dashboard';

  useEffect(() => {
    if (token && user) {
      navigate(from, { replace: true });
    }
  }, [token, user, from, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await login(username.trim(), password);
    setSubmitting(false);
    if (ok) {
      navigate(from, { replace: true });
    }
  };

  const fillDemo = () => {
    setUsername(DEMO_CREDENTIALS.username);
    setPassword(DEMO_CREDENTIALS.password);
  };

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <div className="hidden lg:flex lg:w-1/2 bg-navy-900 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2.5 rounded-xl shadow-lg shadow-emerald-500/30">
            <HeartPulse className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-2xl tracking-tight">MediCase AI</p>
            <p className="text-sm text-slate-400 uppercase tracking-widest">Clinical Suite</p>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold leading-snug">
            AI-powered clinical case-taking &amp; history management for hospitals.
          </h1>
          <p className="text-slate-400 mt-4 leading-relaxed max-w-md">
            Doctors review structured AI clinical summaries, verify patient details, and
            confirm finalized records - all in one secure workspace.
          </p>
          <div className="flex gap-2 mt-8">
            {['Secure Login', 'FHIR / ABDM Ready', 'AI Drafts'].map((chip) => (
              <span
                key={chip}
                className="text-xs font-semibold bg-white/10 border border-white/10 rounded-full px-3 py-1.5"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <p className="text-sm text-slate-500">© 2026 MediCase AI · Hackathon build</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <button
          onClick={() => navigate('/welcome')}
          className="self-start mb-6 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-emerald-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Kiosk
        </button>

        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-emerald-500 p-2 rounded-xl lg:hidden">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Doctor Login</h2>
              <p className="text-sm text-slate-500">Sign in to access the clinical dashboard</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl p-3.5">
              <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
              <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 focus-within:border-emerald-400">
                <User className="w-4 h-4 text-slate-400" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-transparent outline-none text-sm text-slate-700 w-full"
                  placeholder="admin"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 focus-within:border-emerald-400">
                <Lock className="w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent outline-none text-sm text-slate-700 w-full"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !username || !password}
              className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white text-sm font-semibold py-3 rounded-xl shadow-sm transition-colors"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <button
            onClick={fillDemo}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-sm font-semibold py-3 rounded-xl transition-colors"
          >
            Use demo credentials
          </button>
          <p className="mt-3 text-center text-xs text-slate-400">
            Demo login: <span className="font-mono">admin</span> /{' '}
            <span className="font-mono">doctor123</span> (override via env)
          </p>
        </div>
      </div>
    </div>
  );
}
