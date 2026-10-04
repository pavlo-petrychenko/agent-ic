import clsx from 'clsx';
import {
  BANNER_DEFAULT_ICONS,
  BANNER_ICON_SIZE,
  BANNER_ROLES,
  BannerTone,
} from '@/shared/ui/Banner/Banner.constants';
import type { BannerProps } from '@/shared/ui/Banner/Banner.typedefs';
import { Icon } from '@/shared/ui/Icon/Icon';
import styles from '@/shared/ui/Banner/Banner.module.scss';

export function Banner({
  tone = BannerTone.Info,
  icon = BANNER_DEFAULT_ICONS[tone],
  role = BANNER_ROLES[tone],
  className,
  children,
  ...rest
}: BannerProps) {
  return (
    <div {...rest} role={role} className={clsx(styles.root, styles[tone], className)}>
      {icon !== null && <Icon name={icon} size={BANNER_ICON_SIZE} className={styles.icon} />}
      <div className={styles.text}>{children}</div>
    </div>
  );
}
