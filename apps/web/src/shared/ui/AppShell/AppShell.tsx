import clsx from 'clsx';
import { AppShellNavForm, AppShellNavMode } from '@/shared/ui/AppShell/AppShell.constants';
import type { AppShellProps } from '@/shared/ui/AppShell/AppShell.typedefs';
import { Drawer } from '@/shared/ui/Drawer';
import { NarrowScreenNotice } from '@/shared/ui/NarrowScreenNotice';
import { Breakpoint } from '@/shared/viewport/constants/viewport.constants';
import { isCompactBreakpoint } from '@/shared/viewport/helpers/viewport.helpers';
import { useBreakpoint } from '@/shared/viewport/hooks/useBreakpoint';
import styles from '@/shared/ui/AppShell/AppShell.module.scss';

export function AppShell({
  navMode = AppShellNavMode.Auto,
  nav,
  rail = null,
  topbar = null,
  panes,
  detail = null,
  detailOpen = false,
  onDetailOpenChange,
  detailLabel,
  narrowScreen = null,
  className,
  ...rest
}: AppShellProps) {
  const breakpoint = useBreakpoint();
  const compact = isCompactBreakpoint(breakpoint);
  const navForm =
    navMode === AppShellNavMode.Rail || compact ? AppShellNavForm.Rail : AppShellNavForm.Sidebar;
  const swapsToRail = navMode === AppShellNavMode.Auto && compact && rail !== null;
  const guarded = narrowScreen !== null && breakpoint === Breakpoint.Unsupported;
  const hasDetail = detail !== null;

  return (
    <>
      <div {...rest} hidden={guarded} className={clsx(styles.root, className)}>
        <div className={clsx(styles.nav, styles[navForm])}>{swapsToRail ? rail : nav}</div>
        <div className={styles.column}>
          {topbar !== null && <div className={styles.topbar}>{topbar}</div>}
          <div className={styles.body}>
            <main className={styles.panes}>{panes}</main>
            {hasDetail && !compact && detailOpen && (
              <aside aria-label={detailLabel} className={styles.detail}>
                {detail}
              </aside>
            )}
          </div>
        </div>
        {hasDetail && compact && (
          <Drawer
            open={detailOpen && !guarded}
            onOpenChange={onDetailOpenChange}
            ariaLabel={detailLabel}
            className={clsx(topbar === null && styles.drawerFlush)}
          >
            {detail}
          </Drawer>
        )}
      </div>
      {guarded && <NarrowScreenNotice {...narrowScreen} />}
    </>
  );
}
