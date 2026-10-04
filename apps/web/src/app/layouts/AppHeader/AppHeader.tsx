import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Link } from '@/shared/ui/Link';

import styles from './AppHeader.module.scss';
import { LocaleSwitcher } from './LocaleSwitcher';

interface AppHeaderProps {
  children?: ReactNode;
}

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
