import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useLandingWorkspace } from '@/features/auth/communication/hooks/useLandingWorkspace';
import { AUTH_NAMESPACE } from '@/features/auth/constants/authI18n.constants';
import { LOGIN_PATH } from '@/features/auth/constants/authRoute.constants';
import type { InviteInvalidPanelProps } from '@/features/auth/containers/InviteInvalidPanel/InviteInvalidPanel.typedefs';
import { useEnterApp } from '@/features/auth/logic/hooks/useEnterApp';
import { AuthPanel } from '@/features/auth/view/AuthPanel';
import { InviteInvalid } from '@/features/auth/view/InviteInvalid';

export function InviteInvalidPanel({ signedIn }: InviteInvalidPanelProps) {
  const { t } = useTranslation(AUTH_NAMESPACE);
  const navigate = useNavigate();
  const enterApp = useEnterApp(useLandingWorkspace());

  return (
    <AuthPanel>
      <InviteInvalid
        actionLabel={signedIn ? t('invite.invalid.toApp') : t('invite.invalid.toLogin')}
        onAction={() =>
          void (signedIn
            ? enterApp(null)
            : navigate({ to: LOGIN_PATH, search: { redirect: null } }))
        }
      />
    </AuthPanel>
  );
}
