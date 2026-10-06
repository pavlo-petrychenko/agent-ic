import clsx from 'clsx';
import { CHAT_STATUS_ICON_SIZE } from '@/shared/ui/chat/ChatStatus/ChatStatus.constants';
import type { ChatStatusProps } from '@/shared/ui/chat/ChatStatus/ChatStatus.typedefs';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/chat/ChatStatus/ChatStatus.module.scss';

export function ChatStatus({
  text,
  icon,
  inProgress = false,
  className,
  ...rest
}: ChatStatusProps) {
  return (
    <output
      {...rest}
      aria-live="polite"
      aria-busy={inProgress || undefined}
      className={clsx(styles.root, className)}
    >
      <Icon
        name={inProgress ? IconName.Spinner : icon}
        size={CHAT_STATUS_ICON_SIZE}
        className={styles.icon}
      />
      <span>{text}</span>
    </output>
  );
}
