import { ChatSpeaker } from '@/features/testing/constants/simulator.constants';
import { ChatBubbleFrom } from '@/shared/ui/chat/ChatBubble';

export const TURN_ICON_SIZE = 12;

export const SPEAKER_BUBBLES: Readonly<Record<ChatSpeaker, ChatBubbleFrom | null>> = {
  [ChatSpeaker.User]: ChatBubbleFrom.Customer,
  [ChatSpeaker.Agent]: ChatBubbleFrom.Agent,
  [ChatSpeaker.Operator]: ChatBubbleFrom.Operator,
  [ChatSpeaker.System]: null,
};
