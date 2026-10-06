import { useEffect, useState } from 'react';
import { TYPING_MAX_MS } from '@/shared/ui/chat/TypingIndicator/TypingIndicator.constants';

export function useTypingExpiry(): boolean {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setExpired(true), TYPING_MAX_MS);
    return () => clearTimeout(timer);
  }, []);

  return expired;
}
