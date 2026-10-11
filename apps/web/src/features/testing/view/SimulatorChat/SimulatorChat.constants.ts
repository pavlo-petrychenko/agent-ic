import { ChatDividerKind, ChatSpeaker } from '@/features/testing/constants/simulator.constants';
import { ChatBubbleFrom } from '@/shared/ui/chat/ChatBubble';
import { IconName } from '@/shared/ui/foundations/Icon';

export const TURN_ICON_SIZE = 12;

export const SPEAKER_BUBBLES: Readonly<Record<ChatSpeaker, ChatBubbleFrom | null>> = {
  [ChatSpeaker.User]: ChatBubbleFrom.Customer,
  [ChatSpeaker.Agent]: ChatBubbleFrom.Agent,
  [ChatSpeaker.Operator]: ChatBubbleFrom.Operator,
  [ChatSpeaker.System]: null,
};

export const DIVIDER_ICONS: Readonly<Record<ChatDividerKind, IconName>> = {
  [ChatDividerKind.Escalated]: IconName.Pause,
  [ChatDividerKind.HandedBack]: IconName.Agent,
};
