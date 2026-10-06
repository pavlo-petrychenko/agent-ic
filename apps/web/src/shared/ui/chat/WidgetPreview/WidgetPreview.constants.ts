import { ChatBubbleFrom } from '@/shared/ui/chat/ChatBubble/ChatBubble.constants';

export enum WidgetPreviewMessageFrom {
  Bot = 'bot',
  User = 'user',
}

export const WIDGET_PREVIEW_BUBBLE_FROM: Readonly<
  Record<WidgetPreviewMessageFrom, ChatBubbleFrom>
> = {
  [WidgetPreviewMessageFrom.Bot]: ChatBubbleFrom.Agent,
  [WidgetPreviewMessageFrom.User]: ChatBubbleFrom.Customer,
};
