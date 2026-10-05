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
  className,
  children,
}: DrawerProps) {
  const elementRef = useRef<HTMLElement>(null);
  const { mounted, handleAnimationEnd } = useDrawerPresence(open, elementRef);
  useDrawerDismiss({ open, onOpenChange, elementRef });

  if (!mounted) {
    return null;
  }

  return (
    <aside
      ref={elementRef}
      aria-label={ariaLabel}
      tabIndex={-1}
      data-state={open ? DrawerState.Open : DrawerState.Closed}
      className={clsx(styles.root, className)}
      style={width === null ? undefined : { width }}
      onAnimationEnd={handleAnimationEnd}
    >
      {children}
    </aside>
  );
}
