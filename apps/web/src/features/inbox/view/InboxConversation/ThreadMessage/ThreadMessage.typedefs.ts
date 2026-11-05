import type { InboxMessage } from '@/features/inbox/typedefs/message.typedefs';

export interface ThreadMessageProps {
  readonly message: InboxMessage;
}
