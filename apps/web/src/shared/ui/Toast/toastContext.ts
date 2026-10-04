import { createContext } from 'react';
import type { ToastContextValue } from '@/shared/ui/Toast/Toast.typedefs';

export const ToastContext = createContext<ToastContextValue | null>(null);
