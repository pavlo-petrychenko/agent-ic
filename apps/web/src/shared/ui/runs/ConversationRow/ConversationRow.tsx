import { createLink, type LinkComponent } from '@tanstack/react-router';
import clsx from 'clsx';
import { Avatar } from '@/shared/ui/display/Avatar/Avatar';
import { AvatarSize } from '@/shared/ui/display/Avatar/Avatar.constants';
import { Badge } from '@/shared/ui/display/Badge/Badge';
import {
  CONVERSATION_BADGE_DOTS,
  CONVERSATION_BADGE_TONES,
  CONVERSATION_META_SEPARATOR,
} from '@/shared/ui/runs/ConversationRow/ConversationRow.constants';
import type { ConversationRowAnchorProps } from '@/shared/ui/runs/ConversationRow/ConversationRow.typedefs';
import styles from '@/shared/ui/runs/ConversationRow/ConversationRow.module.scss';

function ConversationRowAnchor({
  name,
  initials,
  time,
  dateTime,
  preview,
  channel,
  agent,
  badge = null,
  selected = false,
  unread = false,
  unreadLabel = null,
  className,
  ...rest
}: ConversationRowAnchorProps) {
  return (
    <a
      {...rest}
      aria-current={selected ? 'page' : rest['aria-current']}
      className={clsx(styles.root, selected && styles.selected, className)}
    >
      <Avatar initials={initials} size={AvatarSize.Md} />
      <span className={styles.body}>
        <span className={styles.head}>
          <span className={styles.name}>
            {unread && <span aria-hidden="true" className={styles.unreadDot} />}
            {unread && unreadLabel !== null && <span className={styles.hidden}>{unreadLabel}</span>}
            <span className={styles.nameText}>{name}</span>
          </span>
          <time dateTime={dateTime} className={styles.time}>
            {time}
          </time>
        </span>
        <span className={clsx(styles.preview, unread && styles.previewUnread)}>{preview}</span>
        <span className={styles.meta}>
          <span className={styles.channel}>
            {channel}
            {CONVERSATION_META_SEPARATOR}
            {agent}
          </span>
          {badge !== null && (
            <Badge
              tone={CONVERSATION_BADGE_TONES[badge.kind]}
              dot={CONVERSATION_BADGE_DOTS[badge.kind]}
            >
              {badge.label}
            </Badge>
          )}
        </span>
      </span>
    </a>
  );
}

const RouterConversationRowAnchor = createLink(ConversationRowAnchor);

export const ConversationRow: LinkComponent<typeof ConversationRowAnchor> = (props) => (
  <RouterConversationRowAnchor preload="intent" {...props} />
);
