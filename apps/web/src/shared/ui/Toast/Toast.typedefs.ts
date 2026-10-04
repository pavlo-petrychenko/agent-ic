import type { ReactNode } from 'react';
import type { ToastTone } from '@/shared/ui/Toast/Toast.constants';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  message: string;
  tone?: ToastTone;
  action?: ToastAction | null;
  durationMs?: number | null;
}

export interface ToastItem {
  readonly id: number;
  readonly message: string;
  readonly tone: ToastTone;
  readonly action: ToastAction | null;
  readonly durationMs: number;
}

export interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

export interface ToastProviderProps {
  closeLabel: string;
  children: ReactNode;
}
