import clsx from 'clsx';
import { Separator } from 'radix-ui';
import { DividerOrientation } from '@/shared/ui/Divider/Divider.constants';
import type { DividerProps } from '@/shared/ui/Divider/Divider.typedefs';
import styles from '@/shared/ui/Divider/Divider.module.scss';

export function Divider({
  orientation = DividerOrientation.Horizontal,
  decorative = true,
  className,
}: DividerProps) {
  return (
    <Separator.Root
      orientation={orientation}
      decorative={decorative}
      className={clsx(styles.root, styles[orientation], className)}
    />
  );
}
