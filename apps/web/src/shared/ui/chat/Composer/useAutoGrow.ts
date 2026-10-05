import { useLayoutEffect, useRef } from 'react';
import {
  COMPOSER_HEIGHT_AUTO,
  COMPOSER_HEIGHT_UNIT,
} from '@/shared/ui/chat/Composer/Composer.constants';

export function useAutoGrow(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const field = ref.current;
    if (field === null) {
      return;
    }
    field.style.height = COMPOSER_HEIGHT_AUTO;
    const borders = field.offsetHeight - field.clientHeight;
    field.style.height = `${field.scrollHeight + borders}${COMPOSER_HEIGHT_UNIT}`;
  }, [value]);

  return ref;
}
