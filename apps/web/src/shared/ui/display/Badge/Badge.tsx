import clsx from 'clsx';
import { BadgeTone } from '@/shared/ui/display/Badge/Badge.constants';
import type { BadgeProps } from '@/shared/ui/display/Badge/Badge.typedefs';
import styles from '@/shared/ui/display/Badge/Badge.module.scss';

export function Badge({
  tone = BadgeTone.Neutral,
  dot = false,
  mono = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span {...rest} className={clsx(styles.root, styles[tone], mono && styles.mono, className)}>
      {dot && <span aria-hidden="true" className={styles.dot} />}
      {children}
    </span>
  );
}
