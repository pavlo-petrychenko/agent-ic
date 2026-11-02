import { useInboxPage } from '@/features/inbox/containers/InboxPage/useInboxPage';
import { InboxConversation as InboxConversationView } from '@/features/inbox/view/InboxConversation';
import { InboxList } from '@/features/inbox/view/InboxList';
import { EmptyState } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/inbox/containers/InboxPage/InboxPage.module.scss';

export function InboxPage() {
  const { list, conversation, emptyTitle, emptyDescription } = useInboxPage();

  return (
    <div className="flex h-full min-h-0">
      <InboxList {...list} />
      {conversation === null ? (
        <div className={styles.empty}>
          <EmptyState icon={IconName.Inbox} title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <InboxConversationView {...conversation} />
      )}
    </div>
  );
}
