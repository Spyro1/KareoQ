import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type BackendSongRequest = {
    id: number;
    song_title: string;
    performer: string;
    singers: string;
    notes?: string | null;
    created_at: string;
    played_at?: string | null;
    is_played: boolean;
};

type AdminRequest = {
    id: number;
    songTitle: string;
    performer: string;
    singers: string;
    notes?: string;
    submittedBy: 'guest' | 'host';
    submittedAt: string;
};

type AdminDashboardProps = {
    backendBaseUrl?: string;
};

const formatTimestamp = (value: string) =>
    new Intl.DateTimeFormat('hu-HU', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(value));

const normalizeRequest = (payload: BackendSongRequest, origin: 'guest' | 'host' = 'guest'): AdminRequest => ({
    id: payload.id,
    songTitle: payload.song_title,
    performer: payload.performer,
    singers: payload.singers,
    notes: payload.notes ?? undefined,
    submittedBy: origin,
    submittedAt: payload.created_at
});

const sortRequestsBySubmittedAt = (entries: AdminRequest[]) =>
    [...entries].sort(
        (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    );

export function AdminDashboard({ backendBaseUrl }: AdminDashboardProps): React.ReactElement {
    const [requests, setRequests] = useState<AdminRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [listError, setListError] = useState<string | null>(null);
    const [listNotice, setListNotice] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        songTitle: '',
        performer: '',
        singers: '',
        notes: ''
    });
    const [formStatus, setFormStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
    const [formMessage, setFormMessage] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [wakeStatus, setWakeStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
    const [wakeMessage, setWakeMessage] = useState('');
    const wakeResetRef = useRef<number | null>(null);
    const wakeStartRef = useRef<number | null>(null);

    const backendBase = useMemo(() => backendBaseUrl?.trim().replace(/\/+$/, '') ?? '', [backendBaseUrl]);
    const backendHealthUrl = useMemo(() => (backendBase ? `${backendBase}/health` : ''), [backendBase]);
    const backendRequestsUrl = useMemo(() => (backendBase ? `${backendBase}/requests` : ''), [backendBase]);
    const backendResetUrl = useMemo(() => (backendBase ? `${backendBase}/requests/reset` : ''), [backendBase]);

    const pendingCount = useMemo(() => requests.length, [requests]);

    const loadRequests = useCallback(
        async (mode: 'initial' | 'refresh' = 'initial') => {
            if (!backendRequestsUrl) {
                setListError('Backend URL nincs konfigurálva.');
                setIsLoading(false);
                setIsRefreshing(false);
                return;
            }

            mode === 'initial' ? setIsLoading(true) : setIsRefreshing(true);
            try {
                const response = await fetch(backendRequestsUrl, { cache: 'no-store' });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const data: BackendSongRequest[] = await response.json();
                const normalized = data.map((entry) => normalizeRequest(entry));
                setRequests(sortRequestsBySubmittedAt(normalized));
                setListError(null);
                if (mode === 'initial') {
                    setListNotice(null);
                }
            } catch (error) {
                console.error('Fetch requests failed', error);
                setListError('Nem sikerült lekérni a kéréseket. Próbáld újra.');
            } finally {
                mode === 'initial' ? setIsLoading(false) : setIsRefreshing(false);
            }
        },
        [backendRequestsUrl]
    );

    useEffect(() => {
        loadRequests('initial');
    }, [loadRequests]);

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
        }, 60_000);
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
        wakeStartRef.current = Date.now();

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
            const elapsedSeconds = wakeStartRef.current
                ? ((Date.now() - wakeStartRef.current) / 1000).toFixed(1)
                : undefined;
            setWakeMessage(
                elapsedSeconds ? `Sikeres ébresztés! ${elapsedSeconds} s` : 'Sikeres ébresztés!'
            );
        } catch (error) {
            console.error('Wake backend failed', error);
            setWakeStatus('error');
            if (error instanceof DOMException && error.name === 'AbortError') {
                setWakeMessage('Időtúllépés 60s után.');
            } else {
                setWakeMessage('Nem sikerült ébreszteni.');
            }
        } finally {
            wakeStartRef.current = null;
            queueWakeReset();
        }
    }, [backendHealthUrl, queueWakeReset]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!backendRequestsUrl) {
            setFormStatus('error');
            setFormMessage('Backend URL nincs konfigurálva.');
            return;
        }

        setFormStatus('pending');
        setFormMessage('Mentés folyamatban...');

        try {
            const payload = {
                song_title: formData.songTitle.trim(),
                performer: formData.performer.trim(),
                singers: formData.singers.trim(),
                notes: formData.notes.trim() || undefined
            };

            const response = await fetch(backendRequestsUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                let detail = `Nem sikerült menteni (HTTP ${response.status}).`;
                try {
                    const body = await response.json();
                    if (typeof body?.detail === 'string') {
                        detail = body.detail;
                    }
                } catch {
                    /* ignore */
                }
                throw new Error(detail);
            }

            const created: BackendSongRequest = await response.json();
            setRequests((prev) =>
                sortRequestsBySubmittedAt([...prev, normalizeRequest(created, 'host')])
            );
            setFormStatus('success');
            setFormMessage('Kérés hozzáadva a sorhoz.');
            setFormData({ songTitle: '', performer: '', singers: '', notes: '' });
            setIsFormOpen(false);
        } catch (error) {
            console.error('Admin submit failed', error);
            setFormStatus('error');
            setFormMessage(error instanceof Error ? error.message : 'Ismeretlen hiba történt.');
        }
    };

    const handleComplete = async (id: number) => {
        if (!backendBase) {
            setListError('Backend URL nincs konfigurálva.');
            return;
        }

        try {
            const response = await fetch(`${backendBase}/requests/${id}/play`, {
                method: 'PATCH'
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            setRequests((prev) => prev.filter((entry) => entry.id !== id));
            setListNotice('Kérés lezárva.');
        } catch (error) {
            console.error('Mark as played failed', error);
            setListError('Nem sikerült teljesítettnek jelölni a kérést.');
        }
    };

    const handleResetQueue = useCallback(async () => {
        if (!backendResetUrl) {
            setListError('Backend URL nincs konfigurálva.');
            return;
        }

        if (typeof window !== 'undefined') {
            const confirmed = window.confirm('Biztosan új kareoQ sort nyitsz? Minden kérés törlődik.');
            if (!confirmed) {
                return;
            }
        }

        setIsResetting(true);
        setListError(null);
        setListNotice(null);
        try {
            const response = await fetch(backendResetUrl, { method: 'POST' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            setListNotice('Új kareoQ sor létrehozva, korábbi kérések törölve.');
            await loadRequests('initial');
        } catch (error) {
            console.error('Reset queue failed', error);
            setListError('Nem sikerült új kareoQ sort nyitni.');
        } finally {
            setIsResetting(false);
        }
    }, [backendResetUrl, loadRequests]);

    const openForm = () => {
        setFormStatus('idle');
        setFormMessage('');
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setFormStatus('idle');
        setFormMessage('');
        setIsFormOpen(false);
    };

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
        <>
            <div className="relative flex w-full flex-col gap-3 px-4 py-5 text-slate-100 sm:gap-4 sm:px-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-sm font-semibold uppercase tracking-[0.24em] text-fuchsia-200">kareoQ admin</h1>
                    </div>
                    <nav className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] sm:gap-3">
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
                            <span>{wakeStatus === 'idle' ? 'Backend ébresztése' : wakeMessage}</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleResetQueue}
                            disabled={isResetting}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 sm:px-4 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isResetting ? 'Új kareoQ...' : 'Új kareoQ'}
                        </button>
                        <button
                            type="button"
                            onClick={() => loadRequests('refresh')}
                            disabled={isRefreshing}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 sm:px-4 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isRefreshing ? 'Frissítés...' : 'Lista frissítése'}
                        </button>
                    </nav>
                </header>

                {listError && (
                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-rose-300">
                        {listError}
                    </p>
                )}
                {listNotice && (
                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-emerald-300">
                        {listNotice}
                    </p>
                )}

                <div className="grid gap-6">
                    <section className="rounded-[20px] bg-slate-900/70 p-4 shadow-[0_16px_38px_-28px_rgba(99,102,241,0.5)] backdrop-blur-xl sm:p-5">
                        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-base font-semibold uppercase tracking-[0.18em] text-slate-100">
                                    Következő fellépők
                                </h2>
                                <p className="text-xs uppercase tracking-[0.3em] text-fuchsia-200">
                                    Aktív kérések: {pendingCount}
                                </p>
                            </div>
                        </header>

                        <ul className="mt-5 grid gap-3 sm:gap-4">
                            {isLoading && (
                                <li className="rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-8 text-center text-sm text-slate-300">
                                    Lista betöltése...
                                </li>
                            )}

                            {!isLoading && requests.length === 0 && !listError && (
                                <li className="rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-8 text-center text-sm text-slate-300">
                                    A sor üres — add hozzá az első fellépőt!
                                </li>
                            )}

                            {!isLoading &&
                                requests.map((request) => (
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
                                            </div>
                                        </div>
                                    </li>
                                ))}
                        </ul>
                    </section>
                </div>

                <button
                    type="button"
                    onClick={openForm}
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
                                        disabled={formStatus === 'pending'}
                                        className="w-full rounded-2xl border border-fuchsia-500/40 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_45px_-28px_rgba(247,137,222,0.65)] transition focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/30 disabled:opacity-70"
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
                                        disabled={formStatus === 'pending'}
                                        className="w-full rounded-2xl border border-sky-500/40 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_45px_-28px_rgba(96,165,250,0.55)] transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-400/30 disabled:opacity-70"
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
                                        disabled={formStatus === 'pending'}
                                        className="w-full rounded-2xl border border-emerald-500/40 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_45px_-28px_rgba(16,185,129,0.5)] transition focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-400/30 disabled:opacity-70"
                                    />
                                </label>

                                <label className="grid gap-2 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                                    Megjegyzés <span className="text-slate-500">(opcionális)</span>
                                    <input
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        placeholder="Pl. extra mikrofon vagy hangnem"
                                        disabled={formStatus === 'pending'}
                                        className="w-full rounded-2xl border border-white/15 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_45px_-28px_rgba(148,163,184,0.5)] transition focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/25 disabled:opacity-70"
                                    />
                                </label>

                                {formMessage && (
                                    <p
                                        className={`text-xs font-medium uppercase tracking-[0.25em] ${formStatus === 'error'
                                            ? 'text-rose-300'
                                            : formStatus === 'success'
                                                ? 'text-emerald-300'
                                                : 'text-slate-300'
                                            }`}
                                    >
                                        {formMessage}
                                    </p>
                                )}

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
                                        disabled={formStatus === 'pending'}
                                        className="rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-sky-500 px-8 py-3 text-sm font-semibold uppercase tracking-[0.4em] text-white shadow-[0_0_45px_rgba(99,102,241,0.6)] transition hover:scale-[1.01] hover:shadow-[0_0_65px_rgba(232,121,249,0.75)] focus:outline-none focus:ring-4 focus:ring-fuchsia-400/40 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {formStatus === 'pending' ? 'Mentés...' : 'Rendezői kérés mentése'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div >
            <a
                href="./"
                className="fixed bottom-5 left-5 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-100 shadow-lg transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40 sm:bottom-8 sm:left-8"
            >
                <svg
                    className="h-4 w-4 text-fuchsia-200"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <path
                        d="M5 12h14M12 5l7 7-7 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                Vendég űrlap
            </a>
        </>
    );
}
