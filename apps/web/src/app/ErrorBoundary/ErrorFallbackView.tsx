import { useTranslation } from 'react-i18next';

import { toAppError } from '@/shared/api/appError.helpers';
import { Namespace } from '@/shared/i18n/i18n.constants';
import { useErrorMessage } from '@/shared/i18n/useErrorMessage';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';

interface ErrorFallbackViewProps {
  error: unknown;
  onReset: () => void;
}

export function ErrorFallbackView({ error, onReset }: ErrorFallbackViewProps) {
  const { t } = useTranslation(Namespace.Errors);
  const toErrorMessage = useErrorMessage();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-form items-center px-4">
      <Card title={t('boundary.title')}>
        <p role="alert">{toErrorMessage(toAppError(error))}</p>
        <Button onClick={onReset}>{t('boundary.action')}</Button>
      </Card>
    </main>
  );
}
