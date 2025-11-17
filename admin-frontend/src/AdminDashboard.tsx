import React, { useMemo, useState } from 'react';

type AdminRequest = {
  id: string;
  songTitle: string;
  performer: string;
  singers: string;
  notes?: string;
  submittedBy: 'guest' | 'host';
  submittedAt: string;
};

const defaultQueue: AdminRequest[] = [
  {
    id: 'rq-1',
    songTitle: 'I Will Survive',
    performer: 'Gloria Gaynor',
    singers: 'Dóri & Zsófi',
    notes: 'Kezdjük lassan, refrén kétszer',
    submittedBy: 'guest',
    submittedAt: '2025-11-17T18:40:00Z'
  },
  {
    id: 'rq-2',
    songTitle: 'Highway to Hell',
    performer: 'AC/DC',
    singers: 'Marci',
    notes: 'Gitár intro jöhet hangerősen',
    submittedBy: 'guest',
    submittedAt: '2025-11-17T18:55:00Z'
  },
  {
    id: 'rq-3',
    songTitle: 'Tavaszi szél',
    performer: 'Tradicionális',
    singers: 'Rendezői teszt',
    notes: 'Színpad check',
    submittedBy: 'host',
    submittedAt: '2025-11-17T19:05:00Z'
  }
];

const createRequestId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `rq-${Date.now()}`;

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat('hu-HU', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));

export default function AdminDashboard(): React.ReactElement {
  const [requests, setRequests] = useState<AdminRequest[]>(() => defaultQueue);
  const [formData, setFormData] = useState({
    songTitle: '',
    performer: '',
    singers: '',
    notes: ''
  });

  const pendingCount = useMemo(() => requests.length, [requests]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.songTitle.trim() || !formData.performer.trim() || !formData.singers.trim()) {
      return;
    }

    const newRequest: AdminRequest = {
      id: createRequestId(),
      songTitle: formData.songTitle.trim(),
      performer: formData.performer.trim(),
      singers: formData.singers.trim(),
      notes: formData.notes.trim() || undefined,
      submittedBy: 'host',
      submittedAt: new Date().toISOString()
    };

    setRequests((prev) => [newRequest, ...prev]);
    setFormData({ songTitle: '', performer: '', singers: '', notes: '' });
  };

  const handleComplete = (id: string) => {
    setRequests((prev) => prev.filter((entry) => entry.id !== id));
  };

  return (
    <div className="flex w-full flex-col gap-10 px-6 py-12 font-sans text-slate-100 lg:px-16">
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-fuchsia-200">kareoQ admin</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">Dal kérések kezelése</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Kövesd a vendégek beérkező kéréseit, és add hozzá a rendezői sorba a következő fellépőket.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.28em]">
          <a
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-200 transition hover:bg-white/10"
          >
            Vendég űrlap megnyitása
          </a>
          <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/20 px-4 py-2 text-fuchsia-100">
            Összes kérés: {pendingCount}
          </span>
        </nav>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border border-white/10 bg-slate-900/70 p-8 shadow-[0_0_45px_-12px_rgba(125,106,255,0.55)] backdrop-blur-2xl">
          <header className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Sorban következők</h2>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Következő fellépők listája</p>
            </div>
            <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-sky-200">
              élő sor
            </span>
          </header>

          <ul className="mt-6 grid gap-4">
            {requests.length === 0 && (
              <li className="rounded-2xl border border-white/10 bg-slate-800/60 px-5 py-10 text-center text-sm text-slate-300">
                A sor üres — add hozzá az első fellépőt!
              </li>
            )}

            {requests.map((request) => (
              <li
                key={request.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-800/60 p-5 shadow-[0_20px_60px_-35px_rgba(96,165,250,0.55)] transition hover:border-sky-400/40 hover:shadow-[0_25px_70px_-30px_rgba(99,102,241,0.65)]"
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-fuchsia-500/10 via-purple-500/5 to-sky-500/10 opacity-0 transition group-hover:opacity-100" />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Dal címe</p>
                    <h3 className="text-lg font-semibold text-white">{request.songTitle}</h3>
                    <p className="text-sm text-slate-300">Előadó: {request.performer}</p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>{formatTimestamp(request.submittedAt)}</p>
                    <p className="uppercase tracking-[0.32em] text-slate-500">
                      {request.submittedBy === 'host' ? 'rendező' : 'vendég'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-slate-200">
                  <p className="font-semibold uppercase tracking-[0.25em] text-[0.65rem] text-slate-400">Énekes(ek)</p>
                  <p>{request.singers}</p>
                </div>
                {request.notes && (
                  <p className="mt-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs text-slate-200">
                    {request.notes}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleComplete(request.id)}
                    className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-emerald-200 transition hover:border-emerald-400/60 hover:bg-emerald-500/20"
                  >
                    Lejátszva
                  </button>
                  <span className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">#{request.id}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col justify-between gap-6 rounded-[28px] border border-white/10 bg-slate-900/70 p-8 shadow-[0_0_45px_-12px_rgba(232,121,249,0.55)] backdrop-blur-2xl">
          <div>
            <h2 className="text-lg font-semibold text-white">Új kérés hozzáadása</h2>
            <p className="mt-1 text-xs uppercase tracking-[0.32em] text-slate-400">Rendezői gyors űrlap</p>
          </div>

          <form className="grid gap-5" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Dal címe
              <input
                name="songTitle"
                value={formData.songTitle}
                onChange={handleInputChange}
                required
                placeholder="Pl. Don’t Stop Me Now"
                className="w-full rounded-2xl border border-fuchsia-500/40 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_45px_-28px_rgba(247,137,222,0.65)] transition focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/30"
              />
            </label>

            <label className="grid gap-2 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Előadó / szerző
              <input
                name="performer"
                value={formData.performer}
                onChange={handleInputChange}
                required
                placeholder="Pl. Queen"
                className="w-full rounded-2xl border border-sky-500/40 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_45px_-28px_rgba(96,165,250,0.55)] transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-400/30"
              />
            </label>

            <label className="grid gap-2 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Énekes(ek)
              <input
                name="singers"
                value={formData.singers}
                onChange={handleInputChange}
                required
                placeholder="Sorold fel, ki lép színpadra"
                className="w-full rounded-2xl border border-emerald-500/40 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_45px_-28px_rgba(16,185,129,0.5)] transition focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-400/30"
              />
            </label>

            <label className="grid gap-2 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Megjegyzés <span className="text-slate-500">(opcionális)</span>
              <input
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Pl. extra mikrofon vagy hangnem"
                className="w-full rounded-2xl border border-white/15 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_45px_-28px_rgba(148,163,184,0.5)] transition focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/25"
              />
            </label>

            <button
              type="submit"
              className="mt-2 w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-sky-500 px-8 py-4 text-center text-sm font-semibold uppercase tracking-[0.4em] text-white shadow-[0_0_45px_rgba(99,102,241,0.6)] transition duration-300 hover:scale-[1.01] hover:shadow-[0_0_65px_rgba(232,121,249,0.75)] focus:outline-none focus:ring-4 focus:ring-fuchsia-400/40"
            >
              Rendezői kérés mentése
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
