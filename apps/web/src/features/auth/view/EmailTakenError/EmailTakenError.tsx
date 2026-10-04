import { Trans } from 'react-i18next';
import { AUTH_NAMESPACE } from '@/features/auth/constants/authI18n.constants';
import { FORGOT_PASSWORD_PATH, LOGIN_PATH } from '@/features/auth/constants/authRoute.constants';
import { TextLink, TextLinkTone } from '@/shared/ui/TextLink';

export function EmailTakenError() {
  return (
    <Trans
      ns={AUTH_NAMESPACE}
      i18nKey="signUp.emailTaken"
      components={{
        login: <TextLink to={LOGIN_PATH} tone={TextLinkTone.Error} inline />,
        reset: <TextLink to={FORGOT_PASSWORD_PATH} tone={TextLinkTone.Error} inline />,
      }}
    />
  );
}
