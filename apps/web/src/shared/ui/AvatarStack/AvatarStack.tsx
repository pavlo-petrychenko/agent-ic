import clsx from 'clsx';
import { Avatar } from '@/shared/ui/Avatar/Avatar';
import { AvatarSize } from '@/shared/ui/Avatar/Avatar.constants';
import {
  AVATAR_STACK_DEFAULT_MAX,
  AVATAR_STACK_OVERFLOW_PREFIX,
} from '@/shared/ui/AvatarStack/AvatarStack.constants';
import type { AvatarStackProps } from '@/shared/ui/AvatarStack/AvatarStack.typedefs';
import styles from '@/shared/ui/AvatarStack/AvatarStack.module.scss';

export function AvatarStack({
  avatars,
  max = AVATAR_STACK_DEFAULT_MAX,
  className,
  ...rest
}: AvatarStackProps) {
  const visible = avatars.slice(0, max);
  const hiddenCount = avatars.length - visible.length;

  return (
    <div {...rest} className={clsx(styles.root, className)}>
      {visible.map((avatar, index) => (
        <Avatar
          key={`${avatar.initials}-${index}`}
          {...avatar}
          size={AvatarSize.Sm}
          className={clsx(styles.item, avatar.className)}
        />
      ))}
      {hiddenCount > 0 && (
        <span className={clsx(styles.item, styles.overflow)}>
          {AVATAR_STACK_OVERFLOW_PREFIX}
          {hiddenCount}
        </span>
      )}
    </div>
  );
}
