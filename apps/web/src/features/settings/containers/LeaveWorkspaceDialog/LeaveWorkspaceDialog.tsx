import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLeaveWorkspace } from '@/features/settings/communication/hooks/useLeaveWorkspace';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { LeaveWorkspaceDialogProps } from '@/features/settings/containers/LeaveWorkspaceDialog/LeaveWorkspaceDialog.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Dialog } from '@/shared/ui/overlays/Dialog';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';
import { Text } from '@/shared/ui/typography/Text';

export function LeaveWorkspaceDialog({
  workspaceId,
  workspaceName,
  open,
  onOpenChange,
}: LeaveWorkspaceDialogProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();
  const leaveWorkspace = useLeaveWorkspace();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await leaveWorkspace(workspaceId);
      showToast({ message: t('general.danger.leave.dialog.success'), tone: ToastTone.Ok });
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
      title={t('general.danger.leave.dialog.title', { workspace: workspaceName })}
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
            {t('general.danger.leave.dialog.cancel')}
          </Button>
          <Button variant={ButtonVariant.Danger} loading={busy} onClick={() => void confirm()}>
            {t('general.danger.leave.dialog.confirm')}
          </Button>
        </>
      }
    >
      <Text>{t('general.danger.leave.dialog.description', { workspace: workspaceName })}</Text>
    </Dialog>
  );
}
