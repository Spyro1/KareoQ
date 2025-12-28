import { createContext } from 'react';

export type ToastTone = 'info' | 'success' | 'error';

export type ToastContextValue = {
    showToast: (tone: ToastTone, message: string) => void;
};

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);
