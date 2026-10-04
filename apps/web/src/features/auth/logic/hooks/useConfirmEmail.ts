import { useCallback, useEffect, useRef, useState } from 'react';
import { ConfirmEmailState } from '@/features/auth/constants/confirmation.constants';
import { toConfirmEmailState } from '@/features/auth/logic/helpers/confirmEmail.helpers';
import type { UseConfirmEmailResult } from '@/features/auth/typedefs/confirmation.typedefs';

export function useConfirmEmail(
  token: string | null,
  confirm: (token: string) => Promise<void>,
): UseConfirmEmailResult {
  const [state, setState] = useState(
    token === null ? ConfirmEmailState.Invalid : ConfirmEmailState.Confirming,
  );
  const started = useRef(false);

  const run = useCallback(async () => {
    if (token === null) {
      return;
    }
    setState(ConfirmEmailState.Confirming);
    try {
      await confirm(token);
    } catch (error) {
      setState(toConfirmEmailState(error));
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
