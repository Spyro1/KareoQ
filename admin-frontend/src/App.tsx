import React, { useEffect, useRef, useState } from 'react';
import BackgroundGlow from './BackgroundGlow';
import SongRequestForm from './SongRequestForm';
import { AdminDashboard } from './AdminDashboard';

const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD;

const resolveIsAdmin = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const { hash, pathname } = window.location;
  if (hash) {
    const normalizedHash = hash.replace(/^#/, '').replace(/^\/+/, '');
    if (normalizedHash.startsWith('admin')) {
      return true;
    }
  }

  const segments = pathname.split('/').filter(Boolean);
  return segments.includes('admin');
};

export default function App(): React.ReactElement {
  const [isAdmin, setIsAdmin] = useState(resolveIsAdmin);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleLocationChange = () => setIsAdmin(resolveIsAdmin());

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setIsAuthenticated(false);
      setPasswordInput('');
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && !isAuthenticated) {
      passwordInputRef.current?.focus();
    }
  }, [isAdmin, isAuthenticated]);

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ADMIN_PASSWORD) {
      console.error('Admin password is not configured.');
      return;
    }

    if (passwordInput.trim() === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordInput('');
      return;
    }

    setIsAuthenticated(false);
    setPasswordInput('');
    window.location.assign('./');
  };

  const allowAdminView = isAdmin && isAuthenticated;

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100">
      <BackgroundGlow />
      <div className="relative z-10 flex min-h-screen w-full">
        {allowAdminView ? (
          <AdminDashboard />
        ) : (
          <div className="flex min-h-screen w-full items-center justify-center px-4 py-16">
            <SongRequestForm />
          </div>
        )}
      </div>
      {isAdmin && !isAuthenticated && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/85 backdrop-blur-xl">
          <div className="w-full max-w-md rounded-[28px] border border-white/15 bg-slate-900/90 p-8 shadow-[0_0_55px_-18px_rgba(232,121,249,0.85)]">
            <header className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-fuchsia-200">Admin belépés</p>
              <h1 className="mt-2 text-2xl font-extrabold text-white">Írd be a jelszót</h1>
              <p className="mt-1 text-sm text-slate-300">Csak a szervezők férhetnek hozzá a rendezői felülethez.</p>
            </header>

            <form className="mt-6 grid gap-5" onSubmit={handlePasswordSubmit}>
              <label className="grid gap-2 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                Jelszó
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(event) => setPasswordInput(event.target.value)}
                  ref={passwordInputRef}
                  required
                  className="w-full rounded-2xl border border-fuchsia-400/40 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_45px_-28px_rgba(232,121,249,0.65)] transition focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/30"
                />
              </label>

              <button
                type="submit"
                className="rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-sky-500 px-8 py-3 text-sm font-semibold uppercase tracking-[0.4em] text-white shadow-[0_0_45px_rgba(99,102,241,0.6)] transition hover:scale-[1.01] hover:shadow-[0_0_65px_rgba(232,121,249,0.75)] focus:outline-none focus:ring-4 focus:ring-fuchsia-400/40"
              >
                Belépés
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
