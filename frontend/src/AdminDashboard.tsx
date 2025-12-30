import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Close, Plus, Undo } from 'flowbite-react-icons/outline';
import { useToast } from './useToast';
import { AdminActionButtons } from './AdminActionButtons';
import { AdminRequestTable } from './AdminRequestTable';
import { ActionButton } from './ActionButton';

import type { AdminRequest, BackendSongRequest } from './adminTypes';

type AdminDashboardProps = {
    backendBaseUrl?: string;
};

const ADMIN_IP_PREFIX = 'admin::';

const normalizeRequest = (payload: BackendSongRequest, origin?: 'guest' | 'host'): AdminRequest => {
    const derivedOrigin: 'guest' | 'host' = origin
        ? origin
        : payload.ip_address?.startsWith(ADMIN_IP_PREFIX)
            ? 'host'
            : 'guest';

    return {
        id: payload.id,
        songTitle: payload.song_title,
        performer: payload.performer,
        singers: payload.singers,
        notes: payload.notes ?? undefined,
        submittedBy: derivedOrigin,
        submittedAt: payload.created_at
        ,
        isPlayed: payload.is_played,
        playedAt: payload.played_at ?? undefined
    };
};

const sortRequestsBySubmittedAt = (entries: AdminRequest[]) =>
    [...entries].sort(
        (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    );

export function AdminDashboard({ backendBaseUrl }: AdminDashboardProps): React.ReactElement {
    const [requests, setRequests] = useState<AdminRequest[]>([]);
    const [closedRequests, setClosedRequests] = useState<AdminRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(false);
    const autoRefreshIntervalRef = useRef<number | null>(null);
    const [isKeepAliveEnabled, setIsKeepAliveEnabled] = useState(false);
    const keepAliveIntervalRef = useRef<number | null>(null);

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
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<'pending' | 'closed'>('pending');

    const backendBase = useMemo(() => backendBaseUrl?.trim().replace(/\/+$/, '') ?? '', [backendBaseUrl]);
    const backendHealthUrl = useMemo(() => (backendBase ? `${backendBase}/health` : ''), [backendBase]);
    const backendRequestsUrl = useMemo(() => (backendBase ? `${backendBase}/requests` : ''), [backendBase]);
    const backendAdminRequestsUrl = useMemo(() => (backendRequestsUrl ? `${backendRequestsUrl}?admin=1` : ''), [backendRequestsUrl]);
    const backendResetUrl = backendRequestsUrl;

    const pendingCount = useMemo(() => requests.length, [requests]);


    const loadRequests = useCallback(
        async (mode: 'initial' | 'refresh' = 'initial') => {
            if (!backendRequestsUrl) {
                showToast('error', 'Backend URL nincs konfigurálva.');
                setIsLoading(false);
                setIsRefreshing(false);
                return;
            }

            mode === 'initial' ? setIsLoading(true) : setIsRefreshing(true);
            try {
                const response = await fetch(`${backendRequestsUrl}?include_played=true`, { cache: 'no-store' });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const payload: BackendSongRequest[] = await response.json();
                const normalized = payload.map((entry) => normalizeRequest(entry));
                const pending = normalized.filter((entry) => !entry.isPlayed);
                const closed = normalized.filter((entry) => entry.isPlayed);
                // IMPORTANT: keep backend order for pending requests.
                // The backend already returns pending ordered by (sort_order, created_at).
                // Re-sorting here would undo manual drag ordering.
                setRequests(pending);
                setClosedRequests(sortRequestsBySubmittedAt(closed));
            } catch (error) {
                console.error('Fetch requests failed', error);
                showToast('error', 'Nem sikerült lekérni a kéréseket. Próbáld újra.');
            } finally {
                mode === 'initial' ? setIsLoading(false) : setIsRefreshing(false);
            }
        },
        [backendRequestsUrl, showToast]
    );

    const stopAutoRefresh = useCallback(() => {
        if (typeof window === 'undefined' || autoRefreshIntervalRef.current === null) {
            return;
        }
        window.clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
    }, []);

    useEffect(() => stopAutoRefresh(), [stopAutoRefresh]);

    useEffect(() => {
        stopAutoRefresh();

        if (!isAutoRefreshEnabled) {
            return;
        }

        if (!backendRequestsUrl || typeof window === 'undefined') {
            setIsAutoRefreshEnabled(false);
            return;
        }

        autoRefreshIntervalRef.current = window.setInterval(() => {
            loadRequests('refresh');
        }, 30_000);

        return () => stopAutoRefresh();
    }, [backendRequestsUrl, isAutoRefreshEnabled, loadRequests, stopAutoRefresh]);

    useEffect(() => {
        loadRequests('initial');
    }, [loadRequests]);

    const stopKeepAlive = useCallback(() => {
        if (typeof window === 'undefined' || keepAliveIntervalRef.current === null) {
            return;
        }
        window.clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
    }, []);

    useEffect(() => stopKeepAlive(), [stopKeepAlive]);

    useEffect(() => {
        stopKeepAlive();

        if (!isKeepAliveEnabled) {
            return;
        }

        if (!backendHealthUrl || typeof window === 'undefined') {
            setIsKeepAliveEnabled(false);
            return;
        }

        const ping = () => {
            fetch(backendHealthUrl, { method: 'GET', cache: 'no-store' }).catch(() => {
                // keep-alive should be silent; the explicit refresh button already reports errors
            });
        };

        ping();
        keepAliveIntervalRef.current = window.setInterval(ping, 60_000);

        return () => stopKeepAlive();
    }, [backendHealthUrl, isKeepAliveEnabled, stopKeepAlive]);

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
        if (!backendAdminRequestsUrl) {
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

            const response = await fetch(backendAdminRequestsUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Request': 'true'
                },
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

            await response.json();
            await loadRequests('refresh');
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
            showToast('error', 'Backend URL nincs konfigurálva.');
            return;
        }

        try {
            const response = await fetch(`${backendBase}/requests/${id}/play`, {
                method: 'PATCH'
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const updated: BackendSongRequest = await response.json();
            setRequests((prev) => prev.filter((entry) => entry.id !== id));
            setClosedRequests((prev) => sortRequestsBySubmittedAt([...prev, normalizeRequest(updated)]));
            showToast('success', 'Kérés lezárva.');
        } catch (error) {
            console.error('Mark as played failed', error);
            showToast('error', 'Nem sikerült teljesítettnek jelölni a kérést.');
        }
    };

    const persistQueueOrder = useCallback(
        async (orderedIds: number[]) => {
            if (!backendBase) {
                return;
            }

            try {
                const response = await fetch(`${backendBase}/requests/order?admin=1`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Request': 'true'
                    },
                    body: JSON.stringify({ ordered_ids: orderedIds })
                });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                await loadRequests('refresh');
            } catch (error) {
                console.error('Persist order failed', error);
                showToast('error', 'Nem sikerült elmenteni a sorrendet.');
            }
        },
        [backendBase, loadRequests, showToast]
    );

    const handleRestore = async (id: number) => {
        if (!backendBase) {
            showToast('error', 'Backend URL nincs konfigurálva.');
            return;
        }

        try {
            const response = await fetch(`${backendBase}/requests/${id}/restore`, {
                method: 'PATCH'
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            await response.json();
            await loadRequests('refresh');
            showToast('success', 'Kérés visszarakva a sorba.');
        } catch (error) {
            console.error('Restore request failed', error);
            showToast('error', 'Nem sikerült visszarakni a kérést a sorba.');
        }
    };

    const handleResetQueue = useCallback(async () => {
        if (!backendResetUrl) {
            showToast('error', 'Backend URL nincs konfigurálva.');
            return;
        }

        if (typeof window !== 'undefined') {
            const confirmed = window.confirm('Biztosan új kareoQ sort nyitsz? Minden kérés törlődik.');
            if (!confirmed) {
                return;
            }
        }

        setIsResetting(true);
        try {
            const response = await fetch(backendResetUrl, { method: 'DELETE' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            showToast('info', 'Új kareoQ sor létrehozva, korábbi kérések törölve.');
            await loadRequests('initial');
        } catch (error) {
            console.error('Reset queue failed', error);
            showToast('error', 'Nem sikerült új kareoQ sort nyitni.');
        } finally {
            setIsResetting(false);
        }
    }, [backendResetUrl, loadRequests, showToast]);

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

    return (
        <>
            <div className="relative flex h-[100dvh] w-full flex-col gap-3 overflow-hidden px-4 py-5 text-slate-100 sm:gap-4 sm:px-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-sm font-semibold uppercase tracking-[0.24em] text-fuchsia-200">kareoQ admin</h1>
                    </div>

                    <AdminActionButtons
                        wakeStatus={wakeStatus}
                        wakeMessage={wakeMessage}
                        onWake={handleWakeBackend}
                        isResetting={isResetting}
                        onReset={handleResetQueue}
                        isRefreshing={isRefreshing}
                        onRefresh={() => loadRequests('refresh')}
                        isAutoRefreshEnabled={isAutoRefreshEnabled}
                        onToggleAutoRefresh={() => {
                            setIsAutoRefreshEnabled((prev) => {
                                const next = !prev;
                                if (next) {
                                    loadRequests('refresh');
                                }
                                return next;
                            });
                        }}
                        isKeepAliveEnabled={isKeepAliveEnabled}
                        canKeepAlive={Boolean(backendHealthUrl)}
                        onToggleKeepAlive={() => {
                            setIsKeepAliveEnabled((prev) => !prev);
                        }}
                    />
                </header>
                <div className="flex min-h-0 flex-1 flex-col gap-6 mb-16">
                    <section className="flex min-h-0 flex-col rounded-[20px] bg-slate-900/70 p-4 shadow-[0_16px_38px_-28px_rgba(99,102,241,0.5)] backdrop-blur-xl sm:p-5">
                        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col gap-1">
                                {activeTab === 'pending' ? (
                                    <>
                                        <h2 className="text-base font-semibold uppercase tracking-[0.18em] text-slate-100">
                                            Következő fellépők
                                        </h2>
                                        <p className="text-xs uppercase tracking-[0.3em] text-fuchsia-200">
                                            Aktív kérések: {pendingCount}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-base font-semibold uppercase tracking-[0.18em] text-slate-100">
                                            Lezárt kérések
                                        </h2>
                                        <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
                                            Lezárva: {closedRequests.length}
                                        </p>
                                    </>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center justify-end gap-2">

                                <button
                                    type="button"
                                    disabled={activeTab !== 'pending' || requests.length < 2 || isRefreshing}
                                    onClick={async () => {
                                        const ordered = [...requests].sort(
                                            (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
                                        );
                                        setRequests(ordered);
                                        await persistQueueOrder(ordered.map((entry) => entry.id));
                                    }}
                                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 disabled:cursor-not-allowed disabled:opacity-70 sm:px-4"
                                >
                                    Rendezés idő szerint
                                </button>
                                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('pending')}
                                        className={`rounded-full px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.32em] transition focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 ${activeTab === 'pending'
                                                ? 'bg-white/10 text-white'
                                                : 'text-slate-300 hover:bg-white/10'
                                            }`}
                                    >
                                        Aktív ({pendingCount})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('closed')}
                                        className={`rounded-full px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.32em] transition focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 ${activeTab === 'closed'
                                                ? 'bg-white/10 text-white'
                                                : 'text-slate-300 hover:bg-white/10'
                                            }`}
                                    >
                                        Lezárt ({closedRequests.length})
                                    </button>
                                </div>

                            </div>
                        </header>

                        <div className="mt-5 flex min-h-0 flex-1 flex-col">
                            {isLoading && (
                                <div className="rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-8 text-center text-sm text-slate-300">
                                    Lista betöltése...
                                </div>
                            )}

                            {!isLoading && activeTab === 'pending' && requests.length === 0 && (
                                <div className="rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-8 text-center text-sm text-slate-300">
                                    A sor üres — add hozzá az első fellépőt!
                                </div>
                            )}

                            {!isLoading && activeTab === 'pending' && requests.length > 0 && (
                                <AdminRequestTable
                                    requests={requests}
                                    onRequestsChange={setRequests}
                                    enableReorder
                                    onReorderCommit={persistQueueOrder}
                                    highlightFirstRow
                                    actionLabel="Kész"
                                    actionIcon={<Check className="h-4 w-4" aria-hidden="true" />}
                                    onAction={handleComplete}
                                    actionButtonClassName="rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200 transition hover:border-emerald-400/60 hover:bg-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-emerald-400/35"
                                />
                            )}

                            {!isLoading && activeTab === 'closed' && closedRequests.length === 0 && (
                                <div className="rounded-2xl border border-white/10 bg-slate-800/40 px-4 py-8 text-center text-sm text-slate-300">
                                    Nincs lezárt kérés.
                                </div>
                            )}

                            {!isLoading && activeTab === 'closed' && closedRequests.length > 0 && (
                                <AdminRequestTable
                                    requests={closedRequests}
                                    enableReorder={false}
                                    actionLabel="Vissza"
                                    actionIcon={<Undo className="h-4 w-4" aria-hidden="true" />}
                                    onAction={handleRestore}
                                    actionButtonClassName="rounded-xl border border-sky-400/35 bg-sky-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100 transition hover:border-sky-400/60 hover:bg-sky-500/25 focus:outline-none focus:ring-2 focus:ring-sky-400/35"
                                />
                            )}
                        </div>
                    </section>
                </div>
                <div className="fixed bottom-5 left-0 right-0 z-20 flex items-center justify-between px-4 sm:bottom-8 sm:px-8">
                    <ActionButton
                        label="Vendég űrlap"
                        ariaLabel="Vendég űrlap megnyitása"
                        onClick={() => window.location.assign('./')}
                        leadingIcon={
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
                        }
                        className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-100 shadow-lg transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40"
                    />

                    <ActionButton
                        label={<span className="sr-only sm:not-sr-only">Új kérés</span>}
                        ariaLabel="Új kérés hozzáadása"
                        onClick={openForm}
                        leadingIcon={<Plus className="h-6 w-6" aria-hidden="true" />}
                        className="h-14 w-14 rounded-full border border-fuchsia-400/50 bg-fuchsia-500/15 px-0 py-0 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-fuchsia-100 transition hover:bg-fuchsia-500/25 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 sm:h-auto sm:w-auto sm:px-4 sm:py-3"
                    />
                </div>

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
                                <Close className="h-5 w-5" aria-hidden="true" />
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
        </>
    );
}
