import clsx from 'clsx';
import {
  BANNER_DEFAULT_ICONS,
  BANNER_ICON_SIZE,
  BANNER_ROLES,
  BannerTone,
} from '@/shared/ui/display/Banner/Banner.constants';
import type { BannerProps } from '@/shared/ui/display/Banner/Banner.typedefs';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import styles from '@/shared/ui/display/Banner/Banner.module.scss';

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
