import React, { useMemo, useState } from 'react';
import { useToast } from './useToast';

type SongRequestFormProps = {
  backendBaseUrl?: string;
};

type FormState = {
  songTitle: string;
  performer: string;
  singers: string;
  notes: string;
};

const FIELD_LABELS: Record<keyof FormState, string> = {
  songTitle: 'Dal címe',
  performer: 'Előadó / szerző',
  singers: 'Énekes(ek) neve',
  notes: 'Megjegyzés'
};

const REQUIRED_KEYS: Array<keyof FormState> = ['songTitle', 'performer', 'singers'];

const initialFormState: FormState = {
  songTitle: '',
  performer: '',
  singers: '',
  notes: ''
};

const normalizeBaseUrl = (value?: string) => value?.trim().replace(/\/+$/, '') ?? '';

export default function SongRequestForm({ backendBaseUrl }: SongRequestFormProps): React.ReactElement {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const { showToast } = useToast();

  const backendRequestsUrl = useMemo(() => {
    const normalized = normalizeBaseUrl(backendBaseUrl);
    return normalized ? `${normalized}/requests` : '';
  }, [backendBaseUrl]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name as keyof FormState]) {
        return prev;
      }
      if (value.trim()) {
        const next = { ...prev };
        delete next[name as keyof FormState];
        return next;
      }
      return prev;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!backendRequestsUrl) {
      setStatus('error');
      showToast('error', 'Backend URL nincs konfigurálva. Értesítsd a szervezőt.');
      return;
    }

    const trimmedData: FormState = {
      songTitle: formData.songTitle.trim(),
      performer: formData.performer.trim(),
      singers: formData.singers.trim(),
      notes: formData.notes.trim()
    };

    const missingFields = REQUIRED_KEYS.filter((key) => !trimmedData[key]);
    if (missingFields.length) {
      const errors: Partial<Record<keyof FormState, string>> = {};
      missingFields.forEach((key) => {
        errors[key] = 'Kötelező mező';
      });
      setFieldErrors(errors);
      setStatus('error');
      const labels = missingFields.map((key) => FIELD_LABELS[key]).join(', ');
      showToast('error', `Hiányzó mezők: ${labels}`);
      return;
    }

    setFieldErrors({});
    setStatus('pending');
    showToast('info', 'Kérés elküldése folyamatban...');

    try {
      const payload = {
        song_title: trimmedData.songTitle,
        performer: trimmedData.performer,
        singers: trimmedData.singers,
        notes: trimmedData.notes || undefined
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
      showToast('success', 'Kérés elküldve! A rendező hamarosan keres.');
      setFormData(initialFormState);
      setFieldErrors({});
    } catch (error) {
      console.error('Song request submission failed', error);
      setStatus('error');
      showToast('error', error instanceof Error ? error.message : 'Ismeretlen hiba történt.');
    }
  };

  const isSubmitting = status === 'pending';
  return (
    <div className="flex flex-col min-h-full w-full justify-center px-2 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="z-10 flex flex-col gap-3 text-center">
          <h1 className="text-xl font-semibold uppercase tracking-[0.4em] text-fuchsia-200">kareoQ</h1>
          {/* <p className="mx-auto text-sm text-slate-200 sm:max-w-xl">
          Írd be a kedvenc karaoke számod címét, az eredeti előadót és nevezd meg az énekes(eke)t. A rendező ez alapján pakolja fel a következő fellépést.
        </p> */}
        </header>

        <form
          aria-labelledby="song-request-title"
          onSubmit={handleSubmit}
          className="relative overflow-hidden rounded-[24px] border border-white/10 bg-slate-900/70 p-6 shadow-[0_12px_45px_-24px_rgba(244,114,182,0.6)] backdrop-blur-2xl sm:p-8 md:p-10"
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
                value={formData.songTitle}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Pl. Rocketman"
                aria-invalid={Boolean(fieldErrors.songTitle)}
                className="w-full rounded-2xl border border-fuchsia-500/40 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_45px_-28px_rgba(247,137,222,0.65)] transition focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/30 disabled:opacity-70"
              />
              {fieldErrors.songTitle ? (
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-rose-300">
                  {fieldErrors.songTitle}
                </span>
              ) : null}
            </label>

            <label className="grid gap-2 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              <span>Előadó / szerző</span>
              <input
                id="song-author"
                name="performer"
                type="text"
                value={formData.performer}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Pl. Elton John"
                aria-invalid={Boolean(fieldErrors.performer)}
                className="w-full rounded-2xl border border-fuchsia-500/40 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_45px_-28px_rgba(147,197,253,0.65)] transition focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/30 disabled:opacity-70"
              />
              {fieldErrors.performer ? (
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-rose-300">
                  {fieldErrors.performer}
                </span>
              ) : null}
            </label>

            <label className="grid gap-2 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              <span>Énekes(ek) neve</span>
              <input
                id="singers"
                name="singers"
                type="text"
                value={formData.singers}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Sorold fel, ki lép színpadra"
                aria-invalid={Boolean(fieldErrors.singers)}
                className="w-full rounded-2xl border border-fuchsia-500/40 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_45px_-28px_rgba(74,222,128,0.55)] transition focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/30 disabled:opacity-70"
              />
              {fieldErrors.singers ? (
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-rose-300">
                  {fieldErrors.singers}
                </span>
              ) : null}
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
        </form>
      </div>
    </div>
  );
}
