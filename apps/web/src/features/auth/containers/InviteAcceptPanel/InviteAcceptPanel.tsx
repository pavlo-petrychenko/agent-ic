import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isInviteLinkError } from '@/features/auth/communication/helpers/invite.helpers';
import { useAcceptInvite } from '@/features/auth/communication/hooks/useAcceptInvite';
import { useCurrentUserEmail } from '@/features/auth/communication/hooks/useCurrentUserEmail';
import { AUTH_NAMESPACE } from '@/features/auth/constants/authI18n.constants';
import { WORKSPACE_HOME_PATH } from '@/features/auth/constants/authRoute.constants';
import type { InviteAcceptPanelProps } from '@/features/auth/containers/InviteAcceptPanel/InviteAcceptPanel.typedefs';
import { InviteInvalidPanel } from '@/features/auth/containers/InviteInvalidPanel';
import { inviteHref } from '@/features/auth/logic/helpers/invite.helpers';
import { useLogOut } from '@/features/auth/logic/hooks/useLogOut';
import { AuthPanel } from '@/features/auth/view/AuthPanel';
import { InviteSummary } from '@/features/auth/view/InviteSummary';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { toInitials } from '@/shared/i18n/helpers/initials.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/Button';
import { Callout, CalloutTone } from '@/shared/ui/Callout';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/Text';

export function InviteAcceptPanel({ invite }: InviteAcceptPanelProps) {
  const { t } = useTranslation(AUTH_NAMESPACE);
  const navigate = useNavigate();
  const email = useCurrentUserEmail();
  const acceptInvite = useAcceptInvite();
  const errorMessage = useErrorMessage();
  const { logOut, leaving } = useLogOut();
  const [joining, setJoining] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [linkBroken, setLinkBroken] = useState(false);

  const join = async () => {
    setJoining(true);
    setFailure(null);
    try {
      const workspaceId = await acceptInvite(invite.token);
      if (workspaceId !== null) {
        await navigate({ to: WORKSPACE_HOME_PATH, params: { workspaceId } });
      }
    } catch (error) {
      setLinkBroken(isInviteLinkError(error));
      setFailure(errorMessage(toAppError(error)));
    } finally {
      setJoining(false);
    }
  };

  if (linkBroken) {
    return <InviteInvalidPanel signedIn />;
  }

  return (
    <AuthPanel
      title={t('invite.title', { workspace: invite.workspaceName })}
      subtitle={t('invite.acceptSubtitle', { inviter: invite.inviterName })}
      footer={
        <>
          <Text as={TextElement.Span} kind={TextKind.BodySmall} color={TextColor.Mute}>
            {t('invite.notYou')}
          </Text>
          <Button
            variant={ButtonVariant.Ghost}
            size={ButtonSize.Sm}
            loading={leaving}
            onClick={() => void logOut(inviteHref(invite.token))}
          >
            {t('invite.useAnotherAccount')}
          </Button>
        </>
      }
    >
      <InviteSummary invite={invite} initials={toInitials(invite.workspaceName)} />
      {failure !== null && <Callout tone={CalloutTone.Err}>{failure}</Callout>}
      <Button size={ButtonSize.Lg} fullWidth loading={joining} onClick={() => void join()}>
        {email === null ? t('invite.join') : t('invite.joinAs', { email })}
      </Button>
    </AuthPanel>
  );
}
