import { CloseChatDialog } from '@/features/inbox/containers/CloseChatDialog';
import type { InboxPageProps } from '@/features/inbox/containers/InboxPage/InboxPage.typedefs';
import { useInboxPage } from '@/features/inbox/containers/InboxPage/useInboxPage';
import { InboxConversation as InboxConversationView } from '@/features/inbox/view/InboxConversation';
import { InboxDetails } from '@/features/inbox/view/InboxDetails';
import { InboxList } from '@/features/inbox/view/InboxList';
import { EmptyState } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/inbox/containers/InboxPage/InboxPage.module.scss';

export function InboxPage({ conversationId, onConversationChange }: InboxPageProps) {
  const { list, conversation, details, closeDialog, emptyTitle, emptyDescription } = useInboxPage(
    conversationId,
    onConversationChange,
  );

  return (
    <div className="flex h-full min-h-0">
      <InboxList {...list} />
      {conversation === null || details === null ? (
        <div className={styles.empty}>
          <EmptyState icon={IconName.Inbox} title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <>
          <InboxConversationView {...conversation} />
          <InboxDetails {...details} />
        </>
      )}
      {closeDialog === null ? null : <CloseChatDialog {...closeDialog} />}
    </div>
  );
}
