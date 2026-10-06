import { useCallback, useEffect, useRef, useState } from 'react';
import { CODE_BLOCK_COPIED_RESET_MS } from '@/shared/ui/display/CodeBlock/CodeBlock.constants';
import type { CodeCopy } from '@/shared/ui/display/CodeBlock/CodeBlock.typedefs';

export function useCodeCopy(code: string): CodeCopy {
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
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => setCopied(false), CODE_BLOCK_COPIED_RESET_MS);
    });
  }, [code]);

  return { copied, copy };
}
