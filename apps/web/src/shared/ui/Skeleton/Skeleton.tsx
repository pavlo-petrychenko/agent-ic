import clsx from 'clsx';
import {
  SKELETON_DEFAULT_LINES,
  SKELETON_FULL_WIDTH,
} from '@/shared/ui/Skeleton/Skeleton.constants';
import type { SkeletonProps } from '@/shared/ui/Skeleton/Skeleton.typedefs';
import styles from '@/shared/ui/Skeleton/Skeleton.module.scss';

export function Skeleton({
  label,
  lines = SKELETON_DEFAULT_LINES,
  width = null,
  className,
  style,
  ...rest
}: SkeletonProps) {
  return (
    <output
      {...rest}
      aria-busy="true"
      className={clsx(styles.root, className)}
      style={{ ...style, width: width === null ? SKELETON_FULL_WIDTH : width }}
    >
      <span className={styles.label}>{label}</span>
      {lines.map((line, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={clsx(styles.bar, styles[line.size])}
          style={{ width: line.width }}
        />
      ))}
    </output>
  );
}
