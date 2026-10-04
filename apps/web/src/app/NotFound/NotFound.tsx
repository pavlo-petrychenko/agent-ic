import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui/Card';
import { Link } from '@/shared/ui/Link';

export function NotFound() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-form items-center px-4">
      <Card title={t('notFound.title')}>
        <Link to="/">{t('notFound.action')}</Link>
      </Card>
    </main>
  );
}
