import { useTranslation } from 'react-i18next';
import { LocaleSwitcher } from '@/app/components/LocaleSwitcher';
import type { AppHeaderProps } from '@/app/layouts/AppHeader/AppHeader.typedefs';
import { TextLink } from '@/shared/ui/actions/TextLink';
import styles from '@/app/layouts/AppHeader/AppHeader.module.scss';

export function AppHeader({ children = null }: AppHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className={`${styles.root} flex items-center justify-between gap-4 px-4`}>
      <div className="flex items-center gap-4">
        <TextLink to="/" className={styles.brand}>
          {t('app.name')}
        </TextLink>
        {children}
      </div>
      <LocaleSwitcher />
    </header>
  );
}
