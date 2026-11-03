import { ConversationFooter } from '@/features/inbox/view/InboxConversation/ConversationFooter';
import type { InboxConversationProps } from '@/features/inbox/view/InboxConversation/InboxConversation.typedefs';
import { ThreadMessage } from '@/features/inbox/view/InboxConversation/ThreadMessage';
import { Button } from '@/shared/ui/actions/Button';
import { Avatar, AvatarSize } from '@/shared/ui/display/Avatar';
import { Banner } from '@/shared/ui/display/Banner';
import styles from '@/features/inbox/view/InboxConversation/InboxConversation.module.scss';

export function InboxConversation({
  name,
  initials,
  subtitle,
  actions,
  banner,
  messages,
  footer,
  onAction,
}: InboxConversationProps) {
  return (
    <section className={styles.root} aria-label={name}>
      <header className={styles.header}>
        <Avatar initials={initials} size={AvatarSize.Md} />
        <div className={styles.identity}>
          <span className={styles.name}>{name}</span>
          <span className={styles.subtitle}>{subtitle}</span>
        </div>
        {actions.length === 0 ? null : (
          <div className={styles.actions}>
            {actions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant}
                icon={action.icon}
                onClick={() => onAction(action.id)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </header>
      {banner === null ? null : (
        <Banner tone={banner.tone} icon={banner.icon} className={styles.banner}>
          {banner.text}
        </Banner>
      )}
      <div className={styles.thread}>
        {messages.map((message) => (
          <ThreadMessage key={message.id} message={message} />
        ))}
      </div>
      <footer className={styles.footer}>
        <ConversationFooter footer={footer} />
      </footer>
    </section>
  );
}
