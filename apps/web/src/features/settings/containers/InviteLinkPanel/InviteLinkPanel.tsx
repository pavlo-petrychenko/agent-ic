import { can, INVITABLE_ROLES, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import type { WorkspaceRole } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInviteLink } from '@/features/settings/communication/hooks/useInviteLink';
import { INVITE_LINK_DATE_FORMAT } from '@/features/settings/constants/inviteLink.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { InviteLinkPanelProps } from '@/features/settings/containers/InviteLinkPanel/InviteLinkPanel.typedefs';
import { copyText } from '@/features/settings/logic/helpers/clipboard.helpers';
import { formatDate } from '@/features/settings/logic/helpers/format.helpers';
import { InviteLinkCard } from '@/features/settings/view/InviteLinkCard';
import { useActiveWorkspace } from '@/features/workspace';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { ToastTone, useToast } from '@/shared/ui/Toast';

export function InviteLinkPanel({ workspaceId }: InviteLinkPanelProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const active = useActiveWorkspace(workspaceId);
  const { link, changeRole, reset } = useInviteLink();
  const [resetting, setResetting] = useState(false);

  const run = async (action: () => Promise<void>, success: string) => {
    try {
      await action();
      showToast({ message: success, tone: ToastTone.Ok });
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    }
  };

  const onReset = async () => {
    setResetting(true);
    await run(reset, t('team.invite.resetDone'));
    setResetting(false);
  };

  return (
    <InviteLinkCard
      link={link}
      workspaceName={active?.name ?? ''}
      expiresOn={link === null ? null : formatDate(link.expiresAt, locale, INVITE_LINK_DATE_FORMAT)}
      canEdit={active !== null && can(active.role, PermissionResource.Team, PermissionAction.Edit)}
      roleOptions={INVITABLE_ROLES.map((role) => ({
        value: role,
        label: tCommon(`roles.name.${role}`),
      }))}
      resetting={resetting}
      onCopy={() => {
        if (link !== null) {
          void run(() => copyText(link.url), t('team.invite.copied'));
        }
      }}
      onReset={() => void onReset()}
      onRoleChange={(role: WorkspaceRole) =>
        void run(
          () => changeRole(role),
          t('team.invite.roleChanged', { role: tCommon(`roles.name.${role}`) }),
        )
      }
    />
  );
}
