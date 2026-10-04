import type { ReactNode } from 'react';

import type { ToastTone } from './Toast.constants';

export interface ToastOptions {
  title: string;
  description?: string | null;
  tone?: ToastTone;
}

export interface ToastItem {
  readonly id: number;
  readonly title: string;
  readonly description: string | null;
  readonly tone: ToastTone;
}

export interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

export interface ToastProviderProps {
  closeLabel: string;
  children: ReactNode;
}
