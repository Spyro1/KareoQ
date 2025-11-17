import React from 'react';
import AdminDashboard from './AdminDashboard';
import BackgroundGlow from './BackgroundGlow';
import { SongRequestForm } from './SongRequestForm';

export default function App(): React.ReactElement {
  const isAdmin = typeof window !== 'undefined' && window.location.pathname.endsWith('/admin');

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
