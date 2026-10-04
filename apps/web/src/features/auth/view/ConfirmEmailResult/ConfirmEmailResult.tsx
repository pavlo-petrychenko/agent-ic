import { useTranslation } from 'react-i18next';
import { AUTH_NAMESPACE } from '@/features/auth/constants/authI18n.constants';
import { LOGIN_PATH } from '@/features/auth/constants/authRoute.constants';
import { AuthLinks } from '@/features/auth/view/AuthLinks';
import {
  CONFIRM_EMAIL_LOOKS,
  ConfirmEmailAction,
} from '@/features/auth/view/ConfirmEmailResult/ConfirmEmailResult.constants';
import type { ConfirmEmailResultProps } from '@/features/auth/view/ConfirmEmailResult/ConfirmEmailResult.typedefs';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { TextLink } from '@/shared/ui/TextLink';

export function ConfirmEmailResult({
  state,
  resending,
  errorMessage,
  onResend,
  onRetry,
  onSignUp,
  onLogIn,
}: ConfirmEmailResultProps) {
  const { t } = useTranslation(AUTH_NAMESPACE);
  const look = CONFIRM_EMAIL_LOOKS[state];
  const handlers = {
    [ConfirmEmailAction.Resend]: onResend,
    [ConfirmEmailAction.Retry]: onRetry,
    [ConfirmEmailAction.SignUp]: onSignUp,
    [ConfirmEmailAction.LogIn]: onLogIn,
  };

  return (
    <>
      <EmptyState
        icon={look.icon}
        tone={look.tone}
        title={t(`confirm.${state}.title`)}
        description={errorMessage ?? t(`confirm.${state}.description`)}
      />
      {look.action !== null && (
        <Button
          fullWidth
          loading={look.action.kind === ConfirmEmailAction.Resend && resending}
          onClick={handlers[look.action.kind]}
        >
          {t(look.action.label)}
        </Button>
      )}
      {look.backToLogin && (
        <AuthLinks>
          <TextLink to={LOGIN_PATH}>{t('links.backToLogin')}</TextLink>
        </AuthLinks>
      )}
    </>
  );
}
