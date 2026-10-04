import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui/Card';
import { TextLink } from '@/shared/ui/TextLink';

export function NotFound() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-form items-center px-4">
      <Card title={t('notFound.title')}>
        <TextLink to="/">{t('notFound.action')}</TextLink>
      </Card>
    </main>
  );
}
