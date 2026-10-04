import { useTranslation } from 'react-i18next';
import { useInviteInfo } from '@/features/auth/communication/hooks/useInviteInfo';
import { AUTH_NAMESPACE } from '@/features/auth/constants/authI18n.constants';
import { InviteState } from '@/features/auth/constants/invite.constants';
import { InviteAcceptPanel } from '@/features/auth/containers/InviteAcceptPanel';
import { InviteInvalidPanel } from '@/features/auth/containers/InviteInvalidPanel';
import type { InvitePageProps } from '@/features/auth/containers/InvitePage/InvitePage.typedefs';
import { SignUpPage } from '@/features/auth/containers/SignUpPage';
import { useSessionStatus } from '@/features/auth/logic/hooks/useSessionStatus';
import { AuthPanel } from '@/features/auth/view/AuthPanel';
import { SessionStatus } from '@/shared/api/constants/session.constants';
import { Callout, CalloutTone } from '@/shared/ui/Callout';
import { Skeleton } from '@/shared/ui/Skeleton';

export function InvitePage({ token }: InvitePageProps) {
  const { t } = useTranslation(AUTH_NAMESPACE);
  const signedIn = useSessionStatus() === SessionStatus.Authenticated;
  const { state, invite, errorMessage } = useInviteInfo(token);

  if (state === InviteState.Invalid) {
    return <InviteInvalidPanel signedIn={signedIn} />;
  }
  if (state === InviteState.Ready && invite !== null) {
    return signedIn ? <InviteAcceptPanel invite={invite} /> : <SignUpPage invite={invite} />;
  }
  return (
    <AuthPanel>
      {state === InviteState.Failed ? (
        <Callout tone={CalloutTone.Err}>{errorMessage}</Callout>
      ) : (
        <Skeleton label={t('invite.loading')} />
      )}
    </AuthPanel>
  );
}
