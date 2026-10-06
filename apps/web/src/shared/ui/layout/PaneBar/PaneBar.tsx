import clsx from 'clsx';
import { PaneBarEdge, PaneBarTone } from '@/shared/ui/layout/PaneBar/PaneBar.constants';
import type { PaneBarProps } from '@/shared/ui/layout/PaneBar/PaneBar.typedefs';
import styles from '@/shared/ui/layout/PaneBar/PaneBar.module.scss';

export function PaneBar({
  edge = PaneBarEdge.Top,
  tone = PaneBarTone.Panel,
  row = false,
  softLine = false,
  push = false,
  className,
  children,
  ...rest
}: PaneBarProps) {
  return (
    <div
      {...rest}
      className={clsx(
        styles.root,
        styles[edge],
        styles[tone],
        row && styles.row,
        softLine && styles.soft,
        push && styles.push,
        className,
      )}
    >
      {children}
    </div>
  );
}
