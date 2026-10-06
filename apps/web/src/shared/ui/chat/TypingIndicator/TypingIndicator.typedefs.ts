import type { ComponentProps } from 'react';
import type { ChatBubbleView } from '@/shared/ui/chat/ChatBubble/ChatBubble.constants';

export interface TypingIndicatorProps extends Omit<ComponentProps<'output'>, 'children'> {
  label: string;
  view?: ChatBubbleView;
}
