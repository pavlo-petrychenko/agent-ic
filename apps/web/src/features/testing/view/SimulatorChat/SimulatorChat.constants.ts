import { ChatEventKind, ChatSpeaker } from '@/features/testing/constants/simulator.constants';
import { ChatBubbleFrom } from '@/shared/ui/chat/ChatBubble';
import { IconName } from '@/shared/ui/foundations/Icon';

export const TURN_ICON_SIZE = 12;

export const SPEAKER_BUBBLES: Readonly<Record<ChatSpeaker, ChatBubbleFrom | null>> = {
  [ChatSpeaker.User]: ChatBubbleFrom.Customer,
  [ChatSpeaker.Agent]: ChatBubbleFrom.Agent,
  [ChatSpeaker.Operator]: ChatBubbleFrom.Operator,
  [ChatSpeaker.System]: null,
};

export const EVENT_ICONS: Readonly<Record<ChatEventKind, IconName>> = {
  [ChatEventKind.Escalated]: IconName.Esc,
  [ChatEventKind.HandedOff]: IconName.Hand,
  [ChatEventKind.TakenOver]: IconName.Hand,
  [ChatEventKind.HandedBack]: IconName.Agent,
  [ChatEventKind.Ended]: IconName.Check,
  [ChatEventKind.ClosedInactive]: IconName.Pause,
  [ChatEventKind.Silence]: IconName.Hour,
};
