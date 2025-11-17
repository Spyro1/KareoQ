import React from 'react';
import { SongRequestForm } from './SongRequestForm';

const BackgroundGlow: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.38),transparent_55%),radial-gradient(circle_at_78%_12%,rgba(236,72,153,0.32),transparent_62%),radial-gradient(circle_at_48%_86%,rgba(59,130,246,0.28),transparent_60%)] blur-[60px] opacity-95 animate-glow-pulse-strong-slow"
    />
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-[radial-gradient(circle_at_16%_78%,rgba(14,165,233,0.3),transparent_60%),radial-gradient(circle_at_88%_72%,rgba(249,115,22,0.28),transparent_60%)] blur-[90px] mix-blend-screen animate-glow-pulse-strong-fast"
    />
    <div
      aria-hidden="true"
      className="absolute -left-24 top-[16%] h-80 w-80 rounded-full bg-fuchsia-500/50 blur-[150px] mix-blend-screen animate-glow-drift-a"
      style={{ animationDelay: '2s' }}
    />
    <div
      aria-hidden="true"
      className="absolute right-[-18%] top-[32%] h-[25rem] w-[25rem] rounded-full bg-purple-500/45 blur-[170px] mix-blend-screen animate-glow-drift-b"
      style={{ animationDelay: '6s' }}
    />
    <div
      aria-hidden="true"
      className="absolute left-[4%] bottom-[12%] h-[24rem] w-[24rem] rounded-full bg-sky-400/45 blur-[170px] mix-blend-screen animate-glow-drift-c"
      style={{ animationDelay: '10s' }}
    />
    <div
      aria-hidden="true"
      className="absolute right-[34%] top-[6%] h-72 w-72 rounded-full bg-orange-400/35 blur-[150px] mix-blend-screen animate-glow-drift-b"
      style={{ animationDelay: '14s' }}
    />
    <div
      aria-hidden="true"
      className="absolute right-[12%] bottom-[6%] h-[22rem] w-[22rem] rounded-full bg-sky-500/40 blur-[190px] mix-blend-screen animate-glow-drift-a"
      style={{ animationDelay: '18s' }}
    />
  </div>
);

const App: React.FC = () => (
  <div className="relative flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
    <BackgroundGlow />
    <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-16">
      <SongRequestForm />
    </div>
  </div>
);

export default App;
export { SongRequestForm };
