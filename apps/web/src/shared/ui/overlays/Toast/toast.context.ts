import { createContext } from 'react';
import type { ToastContextValue } from '@/shared/ui/overlays/Toast/Toast.typedefs';

export const ToastContext = createContext<ToastContextValue | null>(null);
