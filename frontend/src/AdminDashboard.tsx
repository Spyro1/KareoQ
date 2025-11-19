import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

type AdminDashboardProps = {
    backendBaseUrl?: string;
};

export function AdminDashboard({ backendBaseUrl }: AdminDashboardProps): React.ReactElement {
    const [requests, setRequests] = useState<AdminRequest[]>(() => defaultQueue);
    const [formData, setFormData] = useState({
        songTitle: '',
        performer: '',
        singers: '',
        notes: ''
    });
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [wakeStatus, setWakeStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
    const [wakeMessage, setWakeMessage] = useState('');
    const wakeResetRef = useRef<number | null>(null);

    const pendingCount = useMemo(() => requests.length, [requests]);
    const backendHealthUrl = useMemo(() => {
        const normalized = backendBaseUrl?.trim().replace(/\/+$/, '') ?? '';
        return normalized ? `${normalized}/health` : '';
    }, [backendBaseUrl]);

    const clearWakeTimeout = useCallback(() => {
        if (typeof window === 'undefined' || wakeResetRef.current === null) {
            return;
        }
        window.clearTimeout(wakeResetRef.current);
        wakeResetRef.current = null;
    }, []);

    useEffect(() => () => clearWakeTimeout(), [clearWakeTimeout]);

    const queueWakeReset = useCallback(() => {
        if (typeof window === 'undefined') {
            return;
        }
        clearWakeTimeout();
        wakeResetRef.current = window.setTimeout(() => {
            setWakeStatus('idle');
            setWakeMessage('');
            wakeResetRef.current = null;
        }, 3500);
    }, [clearWakeTimeout]);

    const handleWakeBackend = useCallback(async () => {
        if (!backendHealthUrl) {
            setWakeStatus('error');
            setWakeMessage('Hiányzik a backend elérési útja.');
            queueWakeReset();
            return;
        }

        setWakeStatus('pending');
        setWakeMessage('Ébresztés...');

        try {
            const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
            let timeoutId: number | null = null;
            if (typeof window !== 'undefined' && controller) {
                timeoutId = window.setTimeout(() => controller.abort(), 60_000);
            }

            const response = await fetch(backendHealthUrl, {
                method: 'GET',
                cache: 'no-store',
                signal: controller?.signal
            });
            if (timeoutId && typeof window !== 'undefined') {
                window.clearTimeout(timeoutId);
            }
            if (!response.ok) {
                throw new Error(`Health check failed with status ${response.status}`);
            }
            setWakeStatus('success');
            setWakeMessage('Sikeres ébresztés!');
        } catch (error) {
            console.error('Wake backend failed', error);
            setWakeStatus('error');
            if (error instanceof DOMException && error.name === 'AbortError') {
                setWakeMessage('Időtúllépés 60s után.');
            } else {
                setWakeMessage('Nem sikerült ébreszteni.');
            }
        } finally {
            queueWakeReset();
        }
    }, [backendHealthUrl, queueWakeReset]);

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
        setIsFormOpen(false);
    };

    const handleComplete = (id: string) => {
        setRequests((prev) => prev.filter((entry) => entry.id !== id));
    };

    const closeForm = () => setIsFormOpen(false);

    const wakeButtonClasses = useMemo(() => {
        switch (wakeStatus) {
            case 'pending':
                return 'cursor-wait border-slate-500/40 bg-slate-700/40 text-slate-300 focus:ring-slate-400/40';
            case 'success':
                return 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25 focus:ring-emerald-400/40';
            case 'error':
                return 'border-rose-400/70 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25 focus:ring-rose-400/40';
            default:
                return 'border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-100 hover:bg-fuchsia-500/25 focus:ring-fuchsia-400/40';
        }
    }, [wakeStatus]);

    return (
        <div className="relative flex w-full flex-col gap-3 px-4 py-5 text-slate-100 sm:gap-4 sm:px-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-sm font-semibold uppercase tracking-[0.24em] text-fuchsia-200">kareoQ admin</h1>
                </div>
                <nav className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] sm:gap-3">
                    <a
                        href="./"
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-slate-200 transition hover:bg-white/10 sm:px-4"
                    >
                        Vendég űrlap
                    </a>
                    <button
                        type="button"
                        onClick={handleWakeBackend}
                        disabled={wakeStatus === 'pending'}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.32em] transition focus:outline-none focus:ring-2 sm:px-4 ${wakeButtonClasses}`}
                    >
                        {wakeStatus === 'pending' && (
                            <svg
                                className="h-3 w-3 animate-spin text-current"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                            >
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                />
                            </svg>
                        )}
                        <span>
                            {wakeStatus === 'idle' ? 'Backend ébresztése' : wakeMessage}
                        </span>
                    </button>
                    <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/15 px-3 py-2 text-[0.7rem] font-medium text-fuchsia-100">
                        Összes kérés: {pendingCount}
                    </span>
                </nav>
            </header>

            <div className="grid gap-6">
                <section className="rounded-[20px] bg-slate-900/70 p-4 shadow-[0_16px_38px_-28px_rgba(99,102,241,0.5)] backdrop-blur-xl sm:p-5">
                    <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-base font-semibold uppercase tracking-[0.18em] text-slate-100">
                                Következő fellépők
                            </h2>
                            <p className="text-xs text-slate-400">Legfrissebb kérés kerül a lista tetejére.</p>
                        </div>
                    </header>

                    <ul className="mt-5 grid gap-3 sm:gap-4">
                        {requests.length === 0 && (
                            <li className="rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-8 text-center text-sm text-slate-300">
                                A sor üres — add hozzá az első fellépőt!
                            </li>
                        )}

                        {requests.map((request) => (
                            <li
                                key={request.id}
                                className="group relative grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-slate-800/60 p-4 shadow-[0_18px_45px_-30px_rgba(96,165,250,0.5)] transition hover:border-sky-400/40 hover:shadow-[0_22px_55px_-30px_rgba(99,102,241,0.6)] sm:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)] sm:p-5"
                            >
                                <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-fuchsia-500/10 via-purple-500/5 to-sky-500/10 opacity-0 transition group-hover:opacity-100" />
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <p className="text-[0.7rem] uppercase tracking-[0.22em] text-slate-400">Dal címe</p>
                                        <h3 className="text-lg font-semibold text-white sm:text-xl">{request.songTitle}</h3>
                                        <p className="text-sm text-slate-300">Előadó: {request.performer}</p>
                                    </div>
                                    <div className="text-sm text-slate-200">
                                        <p className="font-semibold uppercase tracking-[0.2em] text-[0.7rem] text-slate-400">Énekes(ek)</p>
                                        <p className="leading-relaxed">{request.singers}</p>
                                        {request.notes && (
                                            <p className="mt-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs leading-relaxed text-slate-200">
                                                {request.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex w-full items-start justify-between gap-4 sm:flex-col sm:items-end sm:justify-between sm:gap-5">
                                    <div className="text-xs text-slate-400 sm:text-right">
                                        <p>{formatTimestamp(request.submittedAt)}</p>
                                        <p className="uppercase tracking-[0.22em] text-slate-500">
                                            {request.submittedBy === 'host' ? 'rendező' : 'vendég'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleComplete(request.id)}
                                            className="rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200 transition hover:border-emerald-400/60 hover:bg-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-emerald-400/35"
                                        >
                                            Kész
                                        </button>
                                        {/* <div
                      aria-hidden="true"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-dashed border-white/15 text-[0.65rem] uppercase tracking-[0.2em] text-slate-400/70"
                    >
                      +
                    </div> */}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="fixed bottom-6 right-6 z-20 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-sky-500 text-2xl font-bold text-white shadow-[0_0_55px_rgba(232,121,249,0.75)] transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/30 lg:bottom-8 lg:right-10"
                aria-label="Új kérés hozzáadása"
            >
                +
            </button>

            {isFormOpen && (
                <div
                    className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/70 backdrop-blur-xl"
                    onClick={closeForm}
                    role="presentation"
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="relative w-full max-w-xl rounded-[28px] border border-white/15 bg-slate-900/80 p-8 text-slate-100 shadow-[0_0_65px_-20px_rgba(232,121,249,0.95)]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={closeForm}
                            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg font-semibold text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40"
                            aria-label="Bezárás"
                        >
                            ×
                        </button>

                        <div className="mb-6 text-center">
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-fuchsia-200">rendezői űrlap</p>
                            <h2 className="mt-2 text-2xl font-extrabold text-white">Új kérés hozzáadása</h2>
                            <p className="mt-1 text-sm text-slate-300">
                                Add meg a következő fellépés adatait, hogy a vendégek sorban maradjanak.
                            </p>
                        </div>

                        <form className="grid gap-5" onSubmit={handleSubmit}>
                            <label className="grid gap-2 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                                Dal címe
                                <input
                                    name="songTitle"
                                    value={formData.songTitle}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Pl. Don't Stop Me Now"
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

                            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="rounded-2xl border border-white/15 px-6 py-3 text-sm font-semibold uppercase tracking-[0.32em] text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/25"
                                >
                                    Mégse
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-sky-500 px-8 py-3 text-sm font-semibold uppercase tracking-[0.4em] text-white shadow-[0_0_45px_rgba(99,102,241,0.6)] transition hover:scale-[1.01] hover:shadow-[0_0_65px_rgba(232,121,249,0.75)] focus:outline-none focus:ring-4 focus:ring-fuchsia-400/40"
                                >
                                    Rendezői kérés mentése
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
