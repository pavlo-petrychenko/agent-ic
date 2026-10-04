import { useContext } from 'react';
import { TOAST_CONTEXT_MISSING_MESSAGE } from '@/shared/ui/Toast/Toast.constants';
import { ToastContext } from '@/shared/ui/Toast/toast.context';
import type { ToastContextValue } from '@/shared/ui/Toast/Toast.typedefs';

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === null) {
    throw new Error(TOAST_CONTEXT_MISSING_MESSAGE);
  }
  return context;
}
