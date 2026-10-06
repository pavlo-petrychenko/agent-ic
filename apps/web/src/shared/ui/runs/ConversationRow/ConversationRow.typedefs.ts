import type { ComponentProps } from 'react';
import type { ConversationBadgeKind } from '@/shared/ui/runs/ConversationRow/ConversationRow.constants';

export interface ConversationBadge {
  kind: ConversationBadgeKind;
  label: string;
}

export interface ConversationRowAnchorProps extends Omit<
  ComponentProps<'a'>,
  'children' | 'title'
> {
  name: string;
  initials: string;
  time: string;
  dateTime: string;
  preview: string;
  channel: string;
  agent: string;
  badge?: ConversationBadge | null;
  selected?: boolean;
  unread?: boolean;
  unreadLabel?: string | null;
}
