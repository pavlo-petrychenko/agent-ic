import type { InboxMessage } from '@/features/inbox/typedefs/inbox.typedefs';

export interface ThreadMessageProps {
  readonly message: InboxMessage;
}
