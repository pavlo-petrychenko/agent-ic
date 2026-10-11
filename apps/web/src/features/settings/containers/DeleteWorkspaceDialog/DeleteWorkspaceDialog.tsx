import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeleteWorkspace } from '@/features/settings/communication/hooks/useDeleteWorkspace';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { DeleteWorkspaceDialogProps } from '@/features/settings/containers/DeleteWorkspaceDialog/DeleteWorkspaceDialog.typedefs';
import { useAgentCount } from '@/features/workspace';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { PasswordInput } from '@/shared/ui/inputs/PasswordInput';
import { Dialog } from '@/shared/ui/overlays/Dialog';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';
import { Text, TextElement } from '@/shared/ui/typography/Text';

export function DeleteWorkspaceDialog({
  workspaceName,
  memberCount,
  open,
  onOpenChange,
}: DeleteWorkspaceDialogProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();
  const deleteWorkspace = useDeleteWorkspace();
  const agentCount = useAgentCount();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const [typedName, setTypedName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = typedName === workspaceName && password.trim() !== '' && !busy;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setTypedName('');
      setPassword('');
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteWorkspace(typedName, password);
      showToast({ message: t('general.danger.delete.dialog.success'), tone: ToastTone.Ok });
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
      title={t('general.danger.delete.dialog.title', { workspace: workspaceName })}
      description={t('general.danger.delete.dialog.description')}
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
            {t('general.danger.delete.dialog.cancel')}
          </Button>
          <Button
            variant={ButtonVariant.Danger}
            loading={busy}
            disabled={!canSubmit}
            onClick={() => void confirm()}
          >
            {t('general.danger.delete.dialog.confirm')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Text as={TextElement.Paragraph}>
          {t('general.danger.delete.dialog.body', {
            workspace: workspaceName,
            membersCount: memberCount > 1 ? agentCount : '',
            agentsCount: agentCount > 1 ? agentCount : '',
          })}
        </Text>
        <Callout tone={CalloutTone.Info}>{t('general.danger.delete.dialog.notice')}</Callout>
        <Field label={t('general.danger.delete.dialog.confirmLabel', { workspace: workspaceName })}>
          {(control) => (
            <Input
              {...control}
              value={typedName}
              onChange={(event) => setTypedName(event.target.value)}
            />
          )}
        </Field>
        <Field label={t('general.danger.delete.dialog.passwordLabel')}>
          {(control) => (
            <PasswordInput
              {...control}
              value={password}
              autoComplete="new-password"
              showLabel={tCommon('ui.showPassword')}
              hideLabel={tCommon('ui.hidePassword')}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}
        </Field>
      </div>
    </Dialog>
  );
}
