import { WorkspaceRole } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRemoveMember } from '@/features/settings/communication/hooks/useRemoveMember';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { RemoveMemberDialogProps } from '@/features/settings/containers/RemoveMemberDialog/RemoveMemberDialog.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Dialog } from '@/shared/ui/overlays/Dialog';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';
import { Text } from '@/shared/ui/typography/Text';

export function RemoveMemberDialog({
  member,
  roleLabel,
  workspaceName,
  open,
  onOpenChange,
}: RemoveMemberDialogProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();
  const removeMember = useRemoveMember();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberName = member.name;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await removeMember(member.id);
      showToast({
        message: t('team.members.remove.dialog.success', {
          name: memberName,
          workspace: workspaceName,
        }),
        tone: ToastTone.Ok,
      });
      handleOpenChange(false);
    } catch (caught) {
      setError(errorMessage(toAppError(caught)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t('team.members.remove.dialog.title', { name: memberName, workspace: workspaceName })}
      description={t('team.members.remove.dialog.subtitle', {
        email: member.email,
        role: roleLabel,
      })}
      closeLabel={tCommon('ui.close')}
      busy={busy}
      error={error}
      footerRight={
        <>
          <Button
            variant={ButtonVariant.Secondary}
            disabled={busy}
            onClick={() => handleOpenChange(false)}
          >
            {t('team.members.remove.dialog.cancel')}
          </Button>
          <Button variant={ButtonVariant.Danger} loading={busy} onClick={() => void confirm()}>
            {t('team.members.remove.dialog.confirm')}
          </Button>
        </>
      }
    >
      <Text>
        {member.role === WorkspaceRole.Builder
          ? t('team.members.remove.dialog.descriptionBuilder', { name: memberName })
          : t('team.members.remove.dialog.descriptionChats', { name: memberName })}
      </Text>
    </Dialog>
  );
}
