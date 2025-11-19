import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type ToastTone = 'info' | 'success' | 'error';

type ToastPayload = {
    message: string;
    tone: ToastTone;
};

type ToastContextValue = {
    showToast: (tone: ToastTone, message: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
    const [toast, setToast] = useState<ToastPayload | null>(null);
    const timerRef = useRef<number | null>(null);

    const showToast = useCallback((tone: ToastTone, message: string) => {
        if (timerRef.current && typeof window !== 'undefined') {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setToast({ tone, message });
        if (typeof window !== 'undefined') {
            timerRef.current = window.setTimeout(() => {
                setToast(null);
                timerRef.current = null;
            }, 5000);
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }
        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, []);

    const value = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            {toast && (
                <div className="pointer-events-none fixed inset-x-0 top-5 z-40 flex justify-center px-4 sm:top-6">
                    <div
                        className={`pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] shadow-[0_25px_65px_-30px_rgba(232,121,249,0.65)] ${
                            toast.tone === 'success'
                                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
                                : toast.tone === 'error'
                                    ? 'border-rose-400/50 bg-rose-500/20 text-rose-100'
                                    : 'border-sky-400/40 bg-sky-500/15 text-sky-100'
                        }`}
                    >
                        {toast.tone === 'error' && <span aria-hidden="true" className="text-lg">⚠</span>}
                        {toast.tone === 'success' && <span aria-hidden="true" className="text-lg">✔</span>}
                        {toast.tone === 'info' && <span aria-hidden="true" className="text-lg">ℹ</span>}
                        <p>{toast.message}</p>
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
