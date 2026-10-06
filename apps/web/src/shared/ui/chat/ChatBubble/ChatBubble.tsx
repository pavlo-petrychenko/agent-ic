import clsx from 'clsx';
import {
  CHAT_BUBBLE_AGENT_ICON_SIZE,
  CHAT_BUBBLE_LOOKS,
  CHAT_BUBBLE_META_SEPARATOR,
  ChatBubbleFrom,
  ChatBubbleView,
  WIDGET_ACCENT_PROPERTY,
} from '@/shared/ui/chat/ChatBubble/ChatBubble.constants';
import type {
  ChatBubbleProps,
  WidgetAccentStyle,
} from '@/shared/ui/chat/ChatBubble/ChatBubble.typedefs';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/chat/ChatBubble/ChatBubble.module.scss';

export function ChatBubble({
  from,
  author,
  time,
  view = ChatBubbleView.Thread,
  accent = null,
  className,
  style,
  children,
  ...rest
}: ChatBubbleProps) {
  const look = CHAT_BUBBLE_LOOKS[view][from];
  const meta = [author, time].filter((part) => part !== null).join(CHAT_BUBBLE_META_SEPARATOR);
  const accentStyle: WidgetAccentStyle | null =
    accent === null ? null : { ...style, [WIDGET_ACCENT_PROPERTY]: accent };

  return (
    <div
      {...rest}
      style={accentStyle ?? style}
      className={clsx(styles.root, styles[view], styles[look.side], className)}
    >
      {meta !== '' && (
        <span className={styles.meta}>
          {from === ChatBubbleFrom.Agent && (
            <Icon
              name={IconName.Agent}
              size={CHAT_BUBBLE_AGENT_ICON_SIZE}
              className={styles.icon}
            />
          )}
          {meta}
        </span>
      )}
      <div className={clsx(styles.bubble, styles[look.surface])}>{children}</div>
    </div>
  );
}
