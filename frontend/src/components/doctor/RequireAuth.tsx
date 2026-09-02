import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/useAuth';

/**
 * Guards a doctor route: shows a loading state while restoring the session,
 * and redirects to /doctor/login when the doctor is not authenticated.
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { restore, token, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    restore();
  }, [restore]);

  useEffect(() => {
    if (!loading && !token) {
      navigate('/doctor/login', { replace: true });
    }
  }, [loading, token, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-500">Checking session...</p>
      </div>
    );
  }

  if (!token || !user) return null;
  return <>{children}</>;
}
