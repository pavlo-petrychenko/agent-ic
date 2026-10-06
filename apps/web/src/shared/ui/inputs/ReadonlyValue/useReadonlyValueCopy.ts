import { useCallback, useEffect, useRef, useState } from 'react';
import { READONLY_VALUE_COPIED_RESET_MS } from '@/shared/ui/inputs/ReadonlyValue/ReadonlyValue.constants';
import type { ReadonlyValueCopy } from '@/shared/ui/inputs/ReadonlyValue/ReadonlyValue.typedefs';

export function useReadonlyValueCopy(text: string | null): ReadonlyValueCopy {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const copy = useCallback(() => {
    if (text === null) {
      return;
    }
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => setCopied(false), READONLY_VALUE_COPIED_RESET_MS);
    });
  }, [text]);

  return { copied, copy };
}
