import { SkeletonTone } from '@/shared/ui/display/Skeleton/Skeleton.constants';
import { useSkeletonDelay } from '@/shared/ui/display/Skeleton/useSkeletonDelay';
import { SkeletonBox } from '@/shared/ui/display/SkeletonBox/SkeletonBox';
import {
  RUN_SKELETON_DETAIL_HEIGHT,
  RUN_SKELETON_DETAIL_WIDTH,
  RUN_SKELETON_DOT_SIZE,
  RUN_SKELETON_ROWS,
  RUN_SKELETON_TILE_SIZE,
  RUN_SKELETON_TIME_WIDTH,
  RUN_SKELETON_TITLE_HEIGHT,
  RUN_SKELETON_TITLE_WIDTH,
} from '@/shared/ui/runs/RunRow/RunRowsSkeleton/RunRowsSkeleton.constants';
import type { RunRowsSkeletonProps } from '@/shared/ui/runs/RunRow/RunRowsSkeleton/RunRowsSkeleton.typedefs';
import styles from '@/shared/ui/runs/RunRow/RunRowsSkeleton/RunRowsSkeleton.module.scss';

export function RunRowsSkeleton({ label, count = RUN_SKELETON_ROWS }: RunRowsSkeletonProps) {
  const visible = useSkeletonDelay();

  if (!visible) {
    return null;
  }

  return (
    <output aria-busy="true" className={styles.root}>
      <span className={styles.label}>{label}</span>
      {Array.from({ length: count }, (_, row) => (
        <span key={row} aria-hidden="true" className={styles.row}>
          <span className={styles.head}>
            <SkeletonBox
              width={RUN_SKELETON_DOT_SIZE}
              height={RUN_SKELETON_DOT_SIZE}
              tone={SkeletonTone.Strong}
              className={styles.dot}
            />
            <SkeletonBox
              width={RUN_SKELETON_TILE_SIZE}
              height={RUN_SKELETON_TILE_SIZE}
              tone={SkeletonTone.Strong}
            />
            <SkeletonBox
              width={RUN_SKELETON_TITLE_WIDTH}
              height={RUN_SKELETON_TITLE_HEIGHT}
              tone={SkeletonTone.Strong}
            />
            <SkeletonBox
              width={RUN_SKELETON_TIME_WIDTH}
              height={RUN_SKELETON_DETAIL_HEIGHT}
              className={styles.time}
            />
          </span>
          <SkeletonBox
            width={RUN_SKELETON_DETAIL_WIDTH}
            height={RUN_SKELETON_DETAIL_HEIGHT}
            className={styles.detail}
          />
        </span>
      ))}
    </output>
  );
}
