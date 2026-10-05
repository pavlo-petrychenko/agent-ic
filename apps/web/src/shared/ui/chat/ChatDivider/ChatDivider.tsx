import clsx from 'clsx';
import { CHAT_DIVIDER_ICON_SIZE } from '@/shared/ui/chat/ChatDivider/ChatDivider.constants';
import type { ChatDividerProps } from '@/shared/ui/chat/ChatDivider/ChatDivider.typedefs';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import styles from '@/shared/ui/chat/ChatDivider/ChatDivider.module.scss';

export function ChatDivider({ text, icon = null, className, ...rest }: ChatDividerProps) {
  return (
    <div {...rest} className={clsx(styles.root, className)}>
      <span aria-hidden="true" className={styles.rule} />
      {icon !== null && <Icon name={icon} size={CHAT_DIVIDER_ICON_SIZE} />}
      <span>{text}</span>
      <span aria-hidden="true" className={styles.rule} />
    </div>
  );
}
