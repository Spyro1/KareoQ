import React, { useMemo, useState } from 'react';

type SongRequestFormProps = {
  backendBaseUrl?: string;
};

type FormState = {
  songTitle: string;
  performer: string;
  singers: string;
  notes: string;
};

const initialFormState: FormState = {
  songTitle: '',
  performer: '',
  singers: '',
  notes: ''
};

const normalizeBaseUrl = (value?: string) => value?.trim().replace(/\/+$/, '') ?? '';

export default function SongRequestForm({ backendBaseUrl }: SongRequestFormProps): React.ReactElement {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const backendRequestsUrl = useMemo(() => {
    const normalized = normalizeBaseUrl(backendBaseUrl);
    return normalized ? `${normalized}/requests` : '';
  }, [backendBaseUrl]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!backendRequestsUrl) {
      setStatus('error');
      setMessage('Backend URL nincs konfigurálva. Értesítsd a szervezőt.');
      return;
    }

    setStatus('pending');
    setMessage('Kérés elküldése folyamatban...');

    try {
      const payload = {
        song_title: formData.songTitle.trim(),
        performer: formData.performer.trim(),
        singers: formData.singers.trim(),
        notes: formData.notes.trim() || undefined
      };

      const response = await fetch(backendRequestsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let detail = `Nem sikerült elküldeni (HTTP ${response.status}).`;
        try {
          const errorBody = await response.json();
          if (typeof errorBody?.detail === 'string') {
            detail = errorBody.detail;
          }
        } catch {
          /* noop */
        }
        throw new Error(detail);
      }

      setStatus('success');
      setMessage('Kérés elküldve! A rendező hamarosan keres.');
      setFormData(initialFormState);
    } catch (error) {
      console.error('Song request submission failed', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Ismeretlen hiba történt.');
    }
  };

  const isSubmitting = status === 'pending';
  const messageTone =
    status === 'success' ? 'text-emerald-300' : status === 'error' ? 'text-rose-300' : 'text-slate-300';

  return (
    <main className="relative w-full max-w-3xl text-slate-100" role="main">
      <header className="relative z-10 flex flex-col gap-3 text-center">
        <h1 className="text-xl font-semibold uppercase tracking-[0.4em] text-fuchsia-200">kareoQ</h1>
        <p className="mx-auto text-sm text-slate-200 sm:max-w-xl">
          Írd be a kedvenc karaoke számod címét, az eredeti előadót és nevezd meg az énekes(eke)t. A rendező ez alapján pakolja fel a következő fellépést.
        </p>
      </header>

      <form
        aria-labelledby="song-request-title"
        onSubmit={handleSubmit}
        className="relative mt-8 overflow-hidden rounded-[24px] border border-white/10 bg-slate-900/70 p-6 shadow-[0_12px_45px_-24px_rgba(244,114,182,0.6)] backdrop-blur-2xl sm:mt-10 sm:p-8 md:mt-12 md:p-10"
      >
        <div
          className="pointer-events-none absolute inset-x-6 top-0 h-28 bg-gradient-to-b from-white/15 to-transparent blur-3xl sm:inset-x-10 sm:h-32"
          aria-hidden="true"
        />

        <div className="relative grid gap-5 sm:gap-6">
          <label className="grid gap-2 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            <span>Dal címe</span>
            <input
              id="song-title"
              name="songTitle"
              type="text"
              required
              value={formData.songTitle}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Pl. Rocketman"
              className="w-full rounded-2xl border border-fuchsia-500/40 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_45px_-28px_rgba(247,137,222,0.65)] transition focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/30 disabled:opacity-70"
            />
          </label>

          <label className="grid gap-2 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            <span>Előadó / szerző</span>
            <input
              id="song-author"
              name="performer"
              type="text"
              required
              value={formData.performer}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Pl. Elton John"
              className="w-full rounded-2xl border border-fuchsia-500/40 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_45px_-28px_rgba(147,197,253,0.65)] transition focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/30 disabled:opacity-70"
            />
          </label>

          <label className="grid gap-2 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            <span>Énekes(ek) neve</span>
            <input
              id="singers"
              name="singers"
              type="text"
              required
              value={formData.singers}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Sorold fel, ki lép színpadra"
              className="w-full rounded-2xl border border-fuchsia-500/40 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_45px_-28px_rgba(74,222,128,0.55)] transition focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/30 disabled:opacity-70"
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
              value={formData.notes}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Pl: Hány mikrofon kell?"
              className="w-full rounded-2xl border border-fuchsia-500/40 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_45px_-28px_rgba(248,250,252,0.45)] transition focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/30 disabled:opacity-70"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-8 w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-sky-500 px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.36em] text-white shadow-[0_0_35px_rgba(129,140,248,0.55)] transition duration-300 hover:scale-[1.01] hover:shadow-[0_0_55px_rgba(232,121,249,0.75)] focus:outline-none focus:ring-4 focus:ring-fuchsia-400/50 disabled:cursor-not-allowed disabled:opacity-70 sm:px-8"
        >
          {isSubmitting ? 'Kérés küldése...' : 'Kérés elküldése'}
        </button>

        <p className="mt-5 text-center text-[0.7rem] uppercase tracking-[0.36em] text-slate-300">
          a mikrofon rád vár
        </p>

        {message && (
          <p className={`mt-4 text-center text-xs uppercase tracking-[0.25em] ${messageTone}`}>
            {message}
          </p>
        )}
      </form>
    </main>
  );
}
