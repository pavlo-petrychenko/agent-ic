import { useTranslation } from 'react-i18next';
import { LocaleSwitcher } from '@/app/components/LocaleSwitcher';
import { AUTH_BRAND_ICON_SIZE } from '@/app/layouts/AuthLayout/AuthLayout.constants';
import type { AuthLayoutProps } from '@/app/layouts/AuthLayout/AuthLayout.typedefs';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/app/layouts/AuthLayout/AuthLayout.module.scss';

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className={`${styles.root} flex flex-col items-center justify-center gap-6`}>
      <div className={styles.brand}>
        <span className={styles.mark}>
          <Icon name={IconName.Logo} size={AUTH_BRAND_ICON_SIZE} />
        </span>
        <span className={styles.name}>{t('app.name')}</span>
      </div>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <Text as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
          {t('legal.terms')}
        </Text>
        <Text as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
          {t('legal.privacy')}
        </Text>
        <LocaleSwitcher />
      </footer>
    </div>
  );
}
