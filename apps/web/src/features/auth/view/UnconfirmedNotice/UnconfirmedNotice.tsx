import { useTranslation } from 'react-i18next';
import { AUTH_NAMESPACE } from '@/features/auth/constants/authI18n.constants';
import type { UnconfirmedNoticeProps } from '@/features/auth/view/UnconfirmedNotice/UnconfirmedNotice.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';

export function UnconfirmedNotice({ email, resending, onResend }: UnconfirmedNoticeProps) {
  const { t } = useTranslation(AUTH_NAMESPACE);

  return (
    <Callout
      tone={CalloutTone.Warn}
      action={
        <Button
          variant={ButtonVariant.Ghost}
          size={ButtonSize.Sm}
          loading={resending}
          onClick={onResend}
        >
          {t('login.resend')}
        </Button>
      }
    >
      {t('login.unconfirmed', { email })}
    </Callout>
  );
}
