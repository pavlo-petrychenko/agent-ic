import { I18nextProvider, useTranslation } from 'react-i18next';
import type { StartupFailureProps } from '@/app/app.typedefs';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';

function StartupFailureContent() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-form items-center px-4">
      <Card title={t('startup.title')}>
        <p>{t('startup.description')}</p>
        <Button onClick={() => window.location.reload()}>{t('startup.action')}</Button>
      </Card>
    </main>
  );
}

export function StartupFailure({ i18n }: StartupFailureProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <StartupFailureContent />
    </I18nextProvider>
  );
}
