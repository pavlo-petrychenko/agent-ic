import type { KeyboardEvent } from 'react';
import { COMPOSER_SEND_KEY } from '@/shared/ui/chat/Composer/Composer.constants';

export function useSendOnEnter(canSend: boolean, onSend: () => void) {
  return (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== COMPOSER_SEND_KEY || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();
    if (canSend) {
      onSend();
    }
  };
}
