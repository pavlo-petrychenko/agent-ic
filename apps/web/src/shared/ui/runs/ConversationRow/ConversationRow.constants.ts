import { BadgeTone } from '@/shared/ui/display/Badge/Badge.constants';

export enum ConversationBadgeKind {
  You = 'you',
  Waiting = 'waiting',
}

export const CONVERSATION_BADGE_TONES: Readonly<Record<ConversationBadgeKind, BadgeTone>> = {
  [ConversationBadgeKind.You]: BadgeTone.Accent,
  [ConversationBadgeKind.Waiting]: BadgeTone.Warn,
};

export const CONVERSATION_BADGE_DOTS: Readonly<Record<ConversationBadgeKind, boolean>> = {
  [ConversationBadgeKind.You]: false,
  [ConversationBadgeKind.Waiting]: true,
};

export const CONVERSATION_META_SEPARATOR = ' · ';
