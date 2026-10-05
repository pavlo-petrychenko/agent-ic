import clsx from 'clsx';
import {
  CHAT_SYSTEM_MESSAGE_ICON_SIZE,
  ChatSystemMessageTone,
} from '@/shared/ui/chat/ChatSystemMessage/ChatSystemMessage.constants';
import type { ChatSystemMessageProps } from '@/shared/ui/chat/ChatSystemMessage/ChatSystemMessage.typedefs';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import styles from '@/shared/ui/chat/ChatSystemMessage/ChatSystemMessage.module.scss';

export function ChatSystemMessage({
  tone = ChatSystemMessageTone.Neutral,
  icon,
  text,
  className,
  ...rest
}: ChatSystemMessageProps) {
  return (
    <div {...rest} className={clsx(styles.root, styles[tone], className)}>
      <Icon name={icon} size={CHAT_SYSTEM_MESSAGE_ICON_SIZE} />
      <span>{text}</span>
    </div>
  );
}
