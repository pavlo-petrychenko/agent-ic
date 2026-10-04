import { useContext } from 'react';

import { TOAST_CONTEXT_MISSING_MESSAGE } from './Toast.constants';
import type { ToastContextValue } from './Toast.typedefs';
import { ToastContext } from './toastContext';

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === null) {
    throw new Error(TOAST_CONTEXT_MISSING_MESSAGE);
  }
  return context;
}
