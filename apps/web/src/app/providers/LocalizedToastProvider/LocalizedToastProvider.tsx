import { useTranslation } from 'react-i18next';
import type { LocalizedToastProviderProps } from '@/app/providers/LocalizedToastProvider/LocalizedToastProvider.typedefs';
import { ToastProvider } from '@/shared/ui/overlays/Toast';

export function LocalizedToastProvider({ children }: LocalizedToastProviderProps) {
  const { t } = useTranslation();

  return <ToastProvider closeLabel={t('ui.close')}>{children}</ToastProvider>;
}
