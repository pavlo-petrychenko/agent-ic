import { useTranslation } from 'react-i18next';
import { AUTH_NAMESPACE } from '@/features/auth/constants/authI18n.constants';
import { LOGIN_PATH } from '@/features/auth/constants/authRoute.constants';
import { AuthLinks } from '@/features/auth/view/AuthLinks';
import { EMAIL_CHANGE_LOOKS } from '@/features/auth/view/EmailChangeResult/EmailChangeResult.constants';
import type { EmailChangeResultProps } from '@/features/auth/view/EmailChangeResult/EmailChangeResult.typedefs';
import { Button } from '@/shared/ui/actions/Button';
import { TextLink } from '@/shared/ui/actions/TextLink';
import { EmptyState } from '@/shared/ui/display/EmptyState';

export function EmailChangeResult({ state, onRetry }: EmailChangeResultProps) {
  const { t } = useTranslation(AUTH_NAMESPACE);
  const look = EMAIL_CHANGE_LOOKS[state];

  return (
    <>
      <EmptyState
        icon={look.icon}
        tone={look.tone}
        title={t(`emailChange.${state}.title`)}
        description={t(`emailChange.${state}.description`)}
      />
      {look.retry && (
        <Button fullWidth onClick={onRetry}>
          {t('emailChange.retry')}
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
