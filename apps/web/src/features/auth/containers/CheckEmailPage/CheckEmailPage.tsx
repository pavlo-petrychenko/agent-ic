import { useState } from 'react';
import { useLandingWorkspace } from '@/features/auth/communication/hooks/useLandingWorkspace';
import { useResendConfirmation } from '@/features/auth/communication/hooks/useResendConfirmation';
import { CheckEmailNotice } from '@/features/auth/constants/confirmation.constants';
import type { CheckEmailPageProps } from '@/features/auth/containers/CheckEmailPage/CheckEmailPage.typedefs';
import { useEnterApp } from '@/features/auth/logic/hooks/useEnterApp';
import { AuthPanel } from '@/features/auth/view/AuthPanel';
import { CheckEmailMessage } from '@/features/auth/view/CheckEmailMessage';
import { getSessionClient } from '@/shared/api/clients/session.client';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';

export function CheckEmailPage({ email }: CheckEmailPageProps) {
  const enterApp = useEnterApp(useLandingWorkspace());
  const resend = useResendConfirmation();
  const errorMessage = useErrorMessage();
  const [notice, setNotice] = useState<CheckEmailNotice | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

  const run = async (action: () => Promise<void>, setBusy: (busy: boolean) => void) => {
    setBusy(true);
    setNotice(null);
    setFailure(null);
    try {
      await action();
    } catch (error) {
      setFailure(errorMessage(toAppError(error)));
    } finally {
      setBusy(false);
    }
  };

  const onConfirmed = () =>
    run(async () => {
      if (await getSessionClient().refresh()) {
        await enterApp(null);
        return;
      }
      setNotice(CheckEmailNotice.NotConfirmedYet);
    }, setChecking);

  const onResend = () =>
    run(async () => {
      if (email !== null) {
        await resend({ email });
        setNotice(CheckEmailNotice.Resent);
      }
    }, setResending);

  return (
    <AuthPanel>
      <CheckEmailMessage
        email={email}
        notice={notice}
        errorMessage={failure}
        checking={checking}
        resending={resending}
        onConfirmed={() => void onConfirmed()}
        onResend={() => void onResend()}
      />
    </AuthPanel>
  );
}
