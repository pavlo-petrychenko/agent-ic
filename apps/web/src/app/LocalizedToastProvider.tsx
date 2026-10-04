import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { ToastProvider } from '@/shared/ui/Toast';

interface LocalizedToastProviderProps {
  children: ReactNode;
}

export function LocalizedToastProvider({ children }: LocalizedToastProviderProps) {
  const { t } = useTranslation();

  return <ToastProvider closeLabel={t('ui.close')}>{children}</ToastProvider>;
}
