import clsx from 'clsx';
import { useRef } from 'react';
import { DrawerState } from '@/shared/ui/overlays/Drawer/Drawer.constants';
import type { DrawerProps } from '@/shared/ui/overlays/Drawer/Drawer.typedefs';
import { useDrawerDismiss } from '@/shared/ui/overlays/Drawer/useDrawerDismiss';
import { useDrawerPresence } from '@/shared/ui/overlays/Drawer/useDrawerPresence';
import styles from '@/shared/ui/overlays/Drawer/Drawer.module.scss';

export function Drawer({
  open,
  onOpenChange,
  ariaLabel,
  width = null,
  top = null,
  scrim = false,
  className,
  children,
}: DrawerProps) {
  const elementRef = useRef<HTMLElement>(null);
  const { mounted, handleAnimationEnd } = useDrawerPresence(open, elementRef);
  useDrawerDismiss({ open, onOpenChange, elementRef });
  const style = {
    ...(width === null ? {} : { width }),
    ...(top === null ? {} : { top }),
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      {scrim ? (
        <div
          aria-hidden="true"
          className={styles.scrim}
          data-drawer-scrim
          data-state={open ? DrawerState.Open : DrawerState.Closed}
          onClick={() => onOpenChange(false)}
        />
      ) : null}
      <aside
        ref={elementRef}
        aria-label={ariaLabel}
        tabIndex={-1}
        data-state={open ? DrawerState.Open : DrawerState.Closed}
        className={clsx(styles.root, className)}
        style={Object.keys(style).length === 0 ? undefined : style}
        onAnimationEnd={handleAnimationEnd}
      >
        {children}
      </aside>
    </>
  );
}
