import { PermissionAction, PermissionResource, WorkspaceRole } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInviteLink } from '@/features/settings/communication/hooks/useInviteLink';
import { useRoles } from '@/features/settings/communication/hooks/useRoles';
import { INVITE_LINK_DATE_FORMAT } from '@/features/settings/constants/inviteLink.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { InviteLinkPanelProps } from '@/features/settings/containers/InviteLinkPanel/InviteLinkPanel.typedefs';
import { copyText } from '@/features/settings/logic/helpers/clipboard.helpers';
import { formatDate } from '@/features/settings/logic/helpers/format.helpers';
import type { AppRole } from '@/features/settings/typedefs/role.typedefs';
import { InviteLinkCard } from '@/features/settings/view/InviteLinkCard';
import { useActiveWorkspace } from '@/features/workspace';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { hasPermission } from '@/shared/api/helpers/permission.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function InviteLinkPanel({ workspaceId }: InviteLinkPanelProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const active = useActiveWorkspace(workspaceId);
  const { link, changeRole, reset } = useInviteLink();
  const { roles } = useRoles();
  const [resetting, setResetting] = useState(false);

  const labelOf = (role: AppRole): string =>
    role.isSystem ? tCommon(`roles.name.${role.key}`) : (role.name ?? '');

  const roleOptions = roles
    .filter((role) => !(role.isSystem && role.key === WorkspaceRole.Owner))
    .map((role) => ({ value: role.id, label: labelOf(role) }));

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
      canEdit={
        active !== null &&
        hasPermission(active.permissions, PermissionResource.Team, PermissionAction.Edit)
      }
      roleOptions={roleOptions}
      resetting={resetting}
      onCopy={() => {
        if (link !== null) {
          void run(() => copyText(link.url), t('team.invite.copied'));
        }
      }}
      onReset={() => void onReset()}
      onRoleChange={(roleId) => {
        const role = roles.find((entry) => entry.id === roleId);
        if (role !== undefined) {
          void run(() => changeRole(roleId), t('team.invite.roleChanged', { role: labelOf(role) }));
        }
      }}
    />
  );
}
