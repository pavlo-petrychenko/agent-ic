import type { ComponentProps } from 'react';
import type { ChatSystemMessageTone } from '@/shared/ui/chat/ChatSystemMessage/ChatSystemMessage.constants';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export interface ChatSystemMessageProps extends Omit<ComponentProps<'div'>, 'children'> {
  tone?: ChatSystemMessageTone;
  icon: IconName;
  text: string;
}
