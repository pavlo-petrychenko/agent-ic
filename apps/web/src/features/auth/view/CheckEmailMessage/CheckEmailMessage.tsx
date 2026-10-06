import { Trans, useTranslation } from 'react-i18next';
import { AUTH_NAMESPACE } from '@/features/auth/constants/authI18n.constants';
import { SIGN_UP_PATH } from '@/features/auth/constants/authRoute.constants';
import { CheckEmailNotice } from '@/features/auth/constants/confirmation.constants';
import { AuthLinks } from '@/features/auth/view/AuthLinks';
import type { CheckEmailMessageProps } from '@/features/auth/view/CheckEmailMessage/CheckEmailMessage.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { TextLink } from '@/shared/ui/actions/TextLink';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';

export function CheckEmailMessage({
  email,
  notice,
  errorMessage,
  checking,
  resending,
  onConfirmed,
  onResend,
}: CheckEmailMessageProps) {
  const { t } = useTranslation(AUTH_NAMESPACE);

  return (
    <>
      <EmptyState
        icon={IconName.Send}
        tone={EmptyStateTone.Info}
        title={t('checkEmail.title')}
        description={
          email === null ? (
            t('checkEmail.descriptionWithoutEmail')
          ) : (
            <Trans
              ns={AUTH_NAMESPACE}
              i18nKey="checkEmail.description"
              values={{ email }}
              components={{ strong: <strong /> }}
            />
          )
        }
      />
      {notice === CheckEmailNotice.NotConfirmedYet && (
        <Callout tone={CalloutTone.Warn}>{t('checkEmail.notConfirmedYet')}</Callout>
      )}
      {notice === CheckEmailNotice.Resent && (
        <Callout tone={CalloutTone.Ok}>{t('checkEmail.resent')}</Callout>
      )}
      {errorMessage !== null && <Callout tone={CalloutTone.Err}>{errorMessage}</Callout>}
      <Button size={ButtonSize.Lg} fullWidth loading={checking} onClick={onConfirmed}>
        {t('checkEmail.confirmed')}
      </Button>
      <AuthLinks>
        {email !== null && (
          <Button
            variant={ButtonVariant.Ghost}
            size={ButtonSize.Sm}
            loading={resending}
            onClick={onResend}
          >
            {t('checkEmail.resend')}
          </Button>
        )}
        <TextLink to={SIGN_UP_PATH}>{t('checkEmail.useAnotherEmail')}</TextLink>
      </AuthLinks>
    </>
  );
}
