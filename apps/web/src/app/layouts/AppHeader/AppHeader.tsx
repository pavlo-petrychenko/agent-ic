import { useTranslation } from 'react-i18next';
import type { AppHeaderProps } from '@/app/layouts/AppHeader/AppHeader.typedefs';
import { LocaleSwitcher } from '@/app/layouts/AppHeader/LocaleSwitcher';
import { Link } from '@/shared/ui/Link';
import styles from '@/app/layouts/AppHeader/AppHeader.module.scss';

export function AppHeader({ children = null }: AppHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className={`${styles.root} flex items-center justify-between gap-4 px-4`}>
      <div className="flex items-center gap-4">
        <Link to="/" className={styles.brand}>
          {t('app.name')}
        </Link>
        {children}
      </div>
      <LocaleSwitcher />
    </header>
  );
}
