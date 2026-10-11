import { useCallback, useEffect, useRef, useState } from 'react';
import { EmailChangeState } from '@/features/auth/constants/emailChange.constants';
import { toEmailChangeState } from '@/features/auth/logic/helpers/emailChange.helpers';
import type { UseEmailChangeResult } from '@/features/auth/typedefs/confirmation.typedefs';

export function useEmailChangeConfirmation(
  token: string | null,
  confirm: (token: string) => Promise<void>,
): UseEmailChangeResult {
  const [state, setState] = useState(
    token === null ? EmailChangeState.Invalid : EmailChangeState.Confirming,
  );
  const started = useRef(false);

  const run = useCallback(async () => {
    if (token === null) {
      return;
    }
    setState(EmailChangeState.Confirming);
    try {
      await confirm(token);
      setState(EmailChangeState.Changed);
    } catch (error) {
      setState(toEmailChangeState(error));
    }
  }, [token, confirm]);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      void run();
    }
  }, [run]);

  return { state, retry: run };
}
