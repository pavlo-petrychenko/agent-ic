import clsx from 'clsx';
import type { NavGroupProps } from '@/shared/ui/navigation/NavGroup/NavGroup.typedefs';
import styles from '@/shared/ui/navigation/NavGroup/NavGroup.module.scss';

export function NavGroup({ label = null, className, children }: NavGroupProps) {
  return (
    <div className={clsx(styles.root, className)}>
      {label !== null && <span className={styles.label}>{label}</span>}
      {children}
    </div>
  );
}
