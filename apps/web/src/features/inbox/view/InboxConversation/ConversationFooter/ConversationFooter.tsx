import { InboxFooterKind } from '@/features/inbox/constants/inbox.constants';
import type { ConversationFooterProps } from '@/features/inbox/view/InboxConversation/ConversationFooter/ConversationFooter.typedefs';
import { Button } from '@/shared/ui/actions/Button';
import { Composer } from '@/shared/ui/chat/Composer';
import { IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/inbox/view/InboxConversation/InboxConversation.module.scss';

export function ConversationFooter({ footer }: ConversationFooterProps) {
  switch (footer.kind) {
    case InboxFooterKind.Note:
      return <p className={styles.note}>{footer.text}</p>;
    case InboxFooterKind.TakeOver:
      return (
        <Button
          fullWidth
          icon={IconName.Hand}
          disabled={footer.disabled}
          onClick={footer.onTakeOver}
        >
          {footer.label}
        </Button>
      );
    case InboxFooterKind.Composer:
      return (
        <>
          <p className={styles.replyNote}>{footer.note}</p>
          <Composer
            value={footer.value}
            onChange={footer.onChange}
            onSend={footer.onSend}
            onRetry={null}
            retryLabel={footer.sendLabel}
            placeholder={footer.placeholder}
            label={footer.placeholder}
            sendLabel={footer.sendLabel}
            sending={footer.sending}
          />
        </>
      );
  }
}
