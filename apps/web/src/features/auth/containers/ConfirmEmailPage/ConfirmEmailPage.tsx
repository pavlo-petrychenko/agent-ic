import { useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { confirmEmail } from '@/features/auth/communication/helpers/authApi.helpers';
import { useLandingWorkspace } from '@/features/auth/communication/hooks/useLandingWorkspace';
import { useResendConfirmation } from '@/features/auth/communication/hooks/useResendConfirmation';
import {
  CHECK_EMAIL_PATH,
  LOGIN_PATH,
  SIGN_UP_PATH,
} from '@/features/auth/constants/authRoute.constants';
import type { ConfirmEmailPageProps } from '@/features/auth/containers/ConfirmEmailPage/ConfirmEmailPage.typedefs';
import { useConfirmEmail } from '@/features/auth/logic/hooks/useConfirmEmail';
import { useEnterApp } from '@/features/auth/logic/hooks/useEnterApp';
import { AuthPanel } from '@/features/auth/view/AuthPanel';
import { ConfirmEmailResult } from '@/features/auth/view/ConfirmEmailResult';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';

export function ConfirmEmailPage({ token }: ConfirmEmailPageProps) {
  const navigate = useNavigate();
  const enterApp = useEnterApp(useLandingWorkspace());
  const resend = useResendConfirmation();
  const errorMessage = useErrorMessage();
  const [resending, setResending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const confirmAndEnter = useCallback(
    async (value: string) => {
      await confirmEmail(value);
      await enterApp(null);
    },
    [enterApp],
  );
  const { state, retry } = useConfirmEmail(token, confirmAndEnter);

  const onResend = async () => {
    if (token === null) {
      return;
    }
    setResending(true);
    setFailure(null);
    try {
      await resend({ token });
      await navigate({ to: CHECK_EMAIL_PATH, search: { email: null } });
    } catch (error) {
      setFailure(errorMessage(toAppError(error)));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthPanel>
      <ConfirmEmailResult
        state={state}
        resending={resending}
        errorMessage={failure}
        onResend={() => void onResend()}
        onRetry={() => void retry()}
        onSignUp={() => void navigate({ to: SIGN_UP_PATH })}
        onLogIn={() => void navigate({ to: LOGIN_PATH })}
      />
    </AuthPanel>
  );
}
