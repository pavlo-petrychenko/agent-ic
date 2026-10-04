import clsx from 'clsx';
import type { StatusDotProps } from '@/shared/ui/StatusDot/StatusDot.typedefs';
import styles from '@/shared/ui/StatusDot/StatusDot.module.scss';

export function StatusDot({ kind, label = null, className, ...rest }: StatusDotProps) {
  const labelled = label !== null;

  return (
    <span
      {...rest}
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? label : undefined}
      aria-hidden={labelled ? undefined : true}
      className={clsx(styles.root, styles[kind], className)}
    />
  );
}
