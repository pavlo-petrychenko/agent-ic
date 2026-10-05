import type { ComponentProps, CSSProperties, ReactNode } from 'react';
import type {
  ChatBubbleFrom,
  ChatBubbleView,
  WIDGET_ACCENT_PROPERTY,
} from '@/shared/ui/chat/ChatBubble/ChatBubble.constants';

export interface WidgetAccentStyle extends CSSProperties {
  [WIDGET_ACCENT_PROPERTY]: string;
}

export interface ChatBubbleProps extends Omit<ComponentProps<'div'>, 'children'> {
  from: ChatBubbleFrom;
  author: string | null;
  time: string | null;
  view?: ChatBubbleView;
  accent?: string | null;
  children: ReactNode;
}
