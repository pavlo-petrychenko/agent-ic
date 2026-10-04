import { createContext } from 'react';

import type { ToastContextValue } from './Toast.typedefs';

export const ToastContext = createContext<ToastContextValue | null>(null);
