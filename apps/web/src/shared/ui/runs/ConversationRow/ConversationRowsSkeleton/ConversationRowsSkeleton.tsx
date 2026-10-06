import { SkeletonTone } from '@/shared/ui/display/Skeleton/Skeleton.constants';
import { useSkeletonDelay } from '@/shared/ui/display/Skeleton/useSkeletonDelay';
import { SkeletonBox } from '@/shared/ui/display/SkeletonBox/SkeletonBox';
import {
  CONVERSATION_SKELETON_AVATAR_SIZE,
  CONVERSATION_SKELETON_META_HEIGHT,
  CONVERSATION_SKELETON_META_WIDTH,
  CONVERSATION_SKELETON_NAME_HEIGHT,
  CONVERSATION_SKELETON_NAME_WIDTH,
  CONVERSATION_SKELETON_PREVIEW_HEIGHT,
  CONVERSATION_SKELETON_PREVIEW_WIDTH,
  CONVERSATION_SKELETON_ROWS,
} from '@/shared/ui/runs/ConversationRow/ConversationRowsSkeleton/ConversationRowsSkeleton.constants';
import type { ConversationRowsSkeletonProps } from '@/shared/ui/runs/ConversationRow/ConversationRowsSkeleton/ConversationRowsSkeleton.typedefs';
import styles from '@/shared/ui/runs/ConversationRow/ConversationRowsSkeleton/ConversationRowsSkeleton.module.scss';

export function ConversationRowsSkeleton({
  label,
  count = CONVERSATION_SKELETON_ROWS,
}: ConversationRowsSkeletonProps) {
  const visible = useSkeletonDelay();

  if (!visible) {
    return null;
  }

  return (
    <output aria-busy="true" className={styles.root}>
      <span className={styles.label}>{label}</span>
      {Array.from({ length: count }, (_, row) => (
        <span key={row} aria-hidden="true" className={styles.row}>
          <SkeletonBox
            width={CONVERSATION_SKELETON_AVATAR_SIZE}
            height={CONVERSATION_SKELETON_AVATAR_SIZE}
            tone={SkeletonTone.Strong}
            className={styles.avatar}
          />
          <span className={styles.lines}>
            <SkeletonBox
              width={CONVERSATION_SKELETON_NAME_WIDTH}
              height={CONVERSATION_SKELETON_NAME_HEIGHT}
              tone={SkeletonTone.Strong}
            />
            <SkeletonBox
              width={CONVERSATION_SKELETON_PREVIEW_WIDTH}
              height={CONVERSATION_SKELETON_PREVIEW_HEIGHT}
            />
            <SkeletonBox
              width={CONVERSATION_SKELETON_META_WIDTH}
              height={CONVERSATION_SKELETON_META_HEIGHT}
            />
          </span>
        </span>
      ))}
    </output>
  );
}
