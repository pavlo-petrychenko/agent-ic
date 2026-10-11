import { useApolloClient } from '@apollo/client/react';
import { useCallback, useEffect } from 'react';
import { confirmEmailChange } from '@/features/auth/communication/helpers/authApi.helpers';
import { EmailChangeState } from '@/features/auth/constants/emailChange.constants';
import type { ConfirmEmailChangePageProps } from '@/features/auth/containers/ConfirmEmailChangePage/ConfirmEmailChangePage.typedefs';
import { useEmailChangeConfirmation } from '@/features/auth/logic/hooks/useEmailChangeConfirmation';
import { AuthPanel } from '@/features/auth/view/AuthPanel';
import { EmailChangeResult } from '@/features/auth/view/EmailChangeResult';

export function ConfirmEmailChangePage({ token }: ConfirmEmailChangePageProps) {
  const client = useApolloClient();
  const confirm = useCallback((value: string) => confirmEmailChange(value), []);
  const { state, retry } = useEmailChangeConfirmation(token, confirm);

  useEffect(() => {
    if (state === EmailChangeState.Changed) {
      void client.clearStore();
    }
  }, [state, client]);

  return (
    <AuthPanel>
      <EmailChangeResult state={state} onRetry={() => void retry()} />
    </AuthPanel>
  );
}
