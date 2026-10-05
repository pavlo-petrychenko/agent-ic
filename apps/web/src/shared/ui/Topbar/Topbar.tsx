import clsx from 'clsx';
import { Breadcrumb, BreadcrumbSize } from '@/shared/ui/Breadcrumb';
import type { TopbarProps } from '@/shared/ui/Topbar/Topbar.typedefs';
import styles from '@/shared/ui/Topbar/Topbar.module.scss';

export function Topbar({ breadcrumbs, status = null, actions = null, className }: TopbarProps) {
  return (
    <header className={clsx(styles.root, className)}>
      <div className={styles.lead}>
        <Breadcrumb {...breadcrumbs} size={BreadcrumbSize.Topbar} className={styles.crumbs} />
        {status}
      </div>
      {actions !== null && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
