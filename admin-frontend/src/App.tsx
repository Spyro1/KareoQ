import React, { useEffect, useState } from 'react';
import BackgroundGlow from './BackgroundGlow';
import SongRequestForm from './SongRequestForm';
import { AdminDashboard } from './AdminDashboard';

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

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100">
      <BackgroundGlow />
      <div className="relative z-10 flex min-h-screen w-full">
        {isAdmin ? (
          <AdminDashboard />
        ) : (
          <div className="flex min-h-screen w-full items-center justify-center px-4 py-16">
            <SongRequestForm />
          </div>
        )}
      </div>
    </div>
  );
}
