import clsx from 'clsx';
import type { StatusDotProps } from '@/shared/ui/display/StatusDot/StatusDot.typedefs';
import styles from '@/shared/ui/display/StatusDot/StatusDot.module.scss';

export function StatusDot({ kind, label = null, className, ...rest }: StatusDotProps) {
  const dotClassName = clsx(styles.dot, styles[kind]);

  if (label === null) {
    const named = rest['aria-label'] !== undefined;

    return (
      <span
        {...rest}
        data-kind={kind}
        role={named ? 'img' : undefined}
        aria-hidden={named ? undefined : true}
        className={clsx(dotClassName, className)}
      />
    );
  }

  return (
    <span {...rest} className={clsx(styles.root, className)}>
      <span aria-hidden="true" data-kind={kind} className={dotClassName} />
      <span className={styles.label}>{label}</span>
    </span>
  );
}
