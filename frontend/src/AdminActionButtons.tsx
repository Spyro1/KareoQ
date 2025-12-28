import React from 'react';
import { ActionButton } from './ActionButton';
import { ToggleButton } from './ToggleButton';

export type WakeStatus = 'idle' | 'pending' | 'success' | 'error';

export type AdminButtonsTheme = {
    wake: Record<WakeStatus, string>;
    neutral: string;
};

const defaultTheme: AdminButtonsTheme = {
    wake: {
        pending: 'cursor-wait border-slate-500/40 bg-slate-700/40 text-slate-300 focus:ring-slate-400/40',
        success: 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25 focus:ring-emerald-400/40',
        error: 'border-rose-400/70 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25 focus:ring-rose-400/40',
        idle: 'border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-100 hover:bg-fuchsia-500/25 focus:ring-fuchsia-400/40'
    },
    neutral:
        'rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 sm:px-4 disabled:cursor-not-allowed disabled:opacity-70'
};

type AdminActionButtonsProps = {
    wakeStatus: WakeStatus;
    wakeMessage: string;
    onWake: () => void;

    isResetting: boolean;
    onReset: () => void;

    isRefreshing: boolean;
    onRefresh: () => void;

    isAutoRefreshEnabled: boolean;
    onToggleAutoRefresh: () => void;

    isKeepAliveEnabled: boolean;
    onToggleKeepAlive: () => void;
    canKeepAlive: boolean;

    theme?: AdminButtonsTheme;
};

export function AdminActionButtons({
    wakeStatus,
    wakeMessage,
    onWake,
    isResetting,
    onReset,
    isRefreshing,
    onRefresh,
    isAutoRefreshEnabled,
    onToggleAutoRefresh,
    isKeepAliveEnabled,
    onToggleKeepAlive,
    canKeepAlive,
    theme
}: AdminActionButtonsProps): React.ReactElement {
    const resolvedTheme = theme ?? defaultTheme;
    const wakeButtonClasses = resolvedTheme.wake[wakeStatus];

    return (
        <nav className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] sm:gap-3">
            <ActionButton
                label={wakeStatus === 'idle' ? 'Backend ébresztése' : wakeMessage}
                onClick={onWake}
                disabled={wakeStatus === 'pending'}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.32em] transition focus:outline-none focus:ring-2 sm:px-4 ${wakeButtonClasses}`}
                leadingIcon={
                    wakeStatus === 'pending' ? (
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
                    ) : null
                }
            />

            <ActionButton
                label={isResetting ? 'Új kareoQ...' : 'Új kareoQ'}
                onClick={onReset}
                disabled={isResetting}
                className={resolvedTheme.neutral}
            />

            <ActionButton
                label={isRefreshing ? 'Frissítés...' : 'Lista frissítése'}
                onClick={onRefresh}
                disabled={isRefreshing}
                className={resolvedTheme.neutral}
            />

            <ToggleButton
                enabled={isAutoRefreshEnabled}
                onToggle={onToggleAutoRefresh}
                labelOn="Auto frissítés: be"
                labelOff="Auto frissítés: ki"
                baseClassName={resolvedTheme.neutral}
                enabledClassName="border-emerald-300/80 bg-emerald-500/35 text-emerald-50 hover:bg-emerald-500/55 focus:ring-emerald-300/45"
            />

            <ToggleButton
                enabled={isKeepAliveEnabled}
                disabled={!canKeepAlive}
                onToggle={onToggleKeepAlive}
                labelOn="Keep-alive: be"
                labelOff="Keep-alive: ki"
                baseClassName={resolvedTheme.neutral}
                enabledClassName="border-sky-300/80 bg-sky-500/35 text-sky-50 hover:bg-sky-500/45 focus:ring-sky-300/45"
            />
        </nav>
    );
}
