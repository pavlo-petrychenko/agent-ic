import clsx from 'clsx';
import { SkeletonTone } from '@/shared/ui/display/Skeleton/Skeleton.constants';
import type { SkeletonBoxProps } from '@/shared/ui/display/SkeletonBox/SkeletonBox.typedefs';
import styles from '@/shared/ui/display/SkeletonBox/SkeletonBox.module.scss';

export function SkeletonBox({
  width,
  height,
  tone = SkeletonTone.Soft,
  className,
  style,
  ...rest
}: SkeletonBoxProps) {
  return (
    <span
      {...rest}
      aria-hidden="true"
      className={clsx(styles.root, styles[tone], className)}
      style={{ ...style, width, height }}
    />
  );
}
