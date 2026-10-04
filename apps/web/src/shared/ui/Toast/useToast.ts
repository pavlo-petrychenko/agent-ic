import { useContext } from 'react';
import { TOAST_CONTEXT_MISSING_MESSAGE } from '@/shared/ui/Toast/Toast.constants';
import type { ToastContextValue } from '@/shared/ui/Toast/Toast.typedefs';
import { ToastContext } from '@/shared/ui/Toast/toastContext';

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === null) {
    throw new Error(TOAST_CONTEXT_MISSING_MESSAGE);
  }
  return context;
}
