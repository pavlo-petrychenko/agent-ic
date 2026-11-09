import { INBOX_CHAT_FROM, InboxMessageKind } from '@/features/inbox/constants/inbox.constants';
import type { ThreadMessageProps } from '@/features/inbox/view/InboxConversation/ThreadMessage/ThreadMessage.typedefs';
import { ChatBubble } from '@/shared/ui/chat/ChatBubble';
import { ChatDivider } from '@/shared/ui/chat/ChatDivider';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/inbox/view/InboxConversation/InboxConversation.module.scss';

export function ThreadMessage({ message }: ThreadMessageProps) {
  switch (message.kind) {
    case InboxMessageKind.Divider:
      return <ChatDivider text={message.text} icon={message.icon} className={styles.divider} />;
    case InboxMessageKind.Escalation:
      return (
        <div className={styles.escalation}>
          <Icon name={IconName.Hand} size={14} className={styles.escalationIcon} />
          <p className={styles.escalationText}>
            <strong>{message.title}</strong> {message.detail} · {message.time}
          </p>
        </div>
      );
    case InboxMessageKind.Customer:
    case InboxMessageKind.Agent:
    case InboxMessageKind.Operator:
      return (
        <ChatBubble
          from={INBOX_CHAT_FROM[message.kind]}
          author={message.author}
          time={message.time}
        >
          {message.text}
        </ChatBubble>
      );
  }
}
