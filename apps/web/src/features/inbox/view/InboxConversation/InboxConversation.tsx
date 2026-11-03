import { ConversationFooter } from '@/features/inbox/view/InboxConversation/ConversationFooter';
import type { InboxConversationProps } from '@/features/inbox/view/InboxConversation/InboxConversation.typedefs';
import { ThreadMessage } from '@/features/inbox/view/InboxConversation/ThreadMessage';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Avatar, AvatarSize } from '@/shared/ui/display/Avatar';
import { Banner } from '@/shared/ui/display/Banner';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/inbox/view/InboxConversation/InboxConversation.module.scss';

export function InboxConversation({
  name,
  initials,
  subtitle,
  actions,
  banner,
  messages,
  loading,
  loadingLabel,
  loadError,
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
                disabled={action.disabled}
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
        {loadError !== null ? (
          <div className={styles.threadState}>
            <EmptyState
              icon={IconName.Alert}
              tone={EmptyStateTone.Err}
              title={loadError.title}
              actions={
                <Button variant={ButtonVariant.Secondary} onClick={loadError.onRetry}>
                  {loadError.retryLabel}
                </Button>
              }
            />
          </div>
        ) : loading && messages.length === 0 ? (
          <div className={styles.threadState}>
            <Skeleton label={loadingLabel} />
          </div>
        ) : (
          messages.map((message) => <ThreadMessage key={message.id} message={message} />)
        )}
      </div>
      <footer className={styles.footer}>
        <ConversationFooter footer={footer} />
      </footer>
    </section>
  );
}
