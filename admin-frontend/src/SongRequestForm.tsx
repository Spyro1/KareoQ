import React from 'react';

export const SongRequestForm: React.FC = () => (
  <main className="relative w-full max-w-3xl text-slate-100" role="main">
    <form
      aria-labelledby="song-request-title"
      className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/70 p-10 shadow-[0_0_45px_-10px_rgba(244,114,182,0.6)] backdrop-blur-2xl md:p-12"
    >
      <div className="pointer-events-none absolute inset-x-12 top-0 h-32 bg-gradient-to-b from-white/15 to-transparent blur-3xl" aria-hidden="true" />

      <header className="relative grid gap-4 text-center">
        <span className="mx-auto inline-flex items-center justify-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-5 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-fuchsia-300">
          kareoQ
        </span>
        <h1 id="song-request-title" className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_35px_rgba(232,121,249,0.45)] sm:text-5xl">
          KareoQizz
        </h1>
        <p className="mx-auto max-w-xl text-sm text-slate-300 sm:text-base">
          Írd be a kedvenc karaoke számod címét, az eredeti előadót és nevezd meg az énekes(eke)t. A rendező ez alapján pakolja fel a következő fellépést.
        </p>
      </header>

      <div className="relative mt-12 grid gap-6">
        <label className="grid gap-2 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          <span>Dal címe</span>
          <input
            id="song-title"
            name="song-title"
            type="text"
            required
            placeholder="Pl. Rocketman"
            className="w-full rounded-2xl border border-fuchsia-500/40 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_45px_-28px_rgba(247,137,222,0.65)] transition focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/30"
          />
        </label>

        <label className="grid gap-2 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          <span>Előadó / szerző</span>
          <input
            id="song-author"
            name="song-author"
            type="text"
            required
            placeholder="Pl. Elton John"
            className="w-full rounded-2xl border border-fuchsia-500/40 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_45px_-28px_rgba(147,197,253,0.65)] transition focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/30"
          />
        </label>

        <label className="grid gap-2 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          <span>Énekes(ek) neve</span>
          <input
            id="singers"
            name="singers"
            type="text"
            required
            placeholder="Sorold fel, ki lép színpadra"
            className="w-full rounded-2xl border border-fuchsia-500/40 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_45px_-28px_rgba(74,222,128,0.55)] transition focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/30"
          />
        </label>

        <label className="grid gap-2 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          <span>
            Megjegyzés <span className="text-slate-500">(nem kötelező)</span>
          </span>
          <input
            id="notes"
            name="notes"
            type="text"
            placeholder="Pl: Hány mikrofon kell?"
            className="w-full rounded-2xl border border-fuchsia-500/40 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_45px_-28px_rgba(248,250,252,0.45)] transition focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/30"
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-12 w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-sky-500 px-8 py-4 text-center text-sm font-semibold uppercase tracking-[0.4em] text-white shadow-[0_0_35px_rgba(129,140,248,0.55)] transition duration-300 hover:scale-[1.01] hover:shadow-[0_0_55px_rgba(232,121,249,0.75)] focus:outline-none focus:ring-4 focus:ring-fuchsia-400/50"
      >
        Kérés elküldése
      </button>

      <p className="mt-6 text-center text-[0.7rem] uppercase tracking-[0.4em] text-slate-500">
        a mikrofon rád vár
      </p>
    </form>
  </main>
);

export default SongRequestForm;
