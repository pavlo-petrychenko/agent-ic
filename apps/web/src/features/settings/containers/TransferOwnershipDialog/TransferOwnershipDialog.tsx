import { WorkspaceRole } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTeamMembers } from '@/features/settings/communication/hooks/useTeamMembers';
import { useTransferOwnership } from '@/features/settings/communication/hooks/useTransferOwnership';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { TransferOwnershipDialogProps } from '@/features/settings/containers/TransferOwnershipDialog/TransferOwnershipDialog.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Field } from '@/shared/ui/inputs/Field';
import { PasswordInput } from '@/shared/ui/inputs/PasswordInput';
import { Select } from '@/shared/ui/inputs/Select';
import { Dialog } from '@/shared/ui/overlays/Dialog';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';

const NO_MEMBER = '';

export function TransferOwnershipDialog({
  workspaceName,
  open,
  onOpenChange,
}: TransferOwnershipDialogProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();
  const { members } = useTeamMembers();
  const transferOwnership = useTransferOwnership();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();

  const [targetId, setTargetId] = useState(NO_MEMBER);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const candidates = members.filter((member) => member.role !== WorkspaceRole.Owner);
  const target = candidates.find((member) => member.id === targetId) ?? null;
  const canSubmit = Boolean(target) && Boolean(password.trim()) && !busy;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setTargetId(NO_MEMBER);
      setPassword('');
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await transferOwnership(targetId, password);
      showToast({ message: t('general.danger.transfer.dialog.success'), tone: ToastTone.Ok });
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
      title={t('general.danger.transfer.dialog.title', { workspace: workspaceName })}
      description={t('general.danger.transfer.dialog.description')}
      closeLabel={tCommon('ui.close')}
      busy={busy}
      error={error}
      footerRight={
        <>
          <Button
            variant={ButtonVariant.Ghost}
            disabled={busy}
            onClick={() => handleOpenChange(false)}
          >
            {t('general.danger.transfer.dialog.cancel')}
          </Button>
          <Button loading={busy} disabled={!canSubmit} onClick={() => void confirm()}>
            {t('general.danger.transfer.dialog.confirm')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label={t('general.danger.transfer.dialog.memberLabel')}>
          {(control) => (
            <Select
              {...control}
              value={targetId}
              options={[
                {
                  value: NO_MEMBER,
                  label: t('general.danger.transfer.dialog.placeholder'),
                  disabled: true,
                },
                ...candidates.map((member) => ({
                  value: member.id,
                  label: `${member.name} · ${tCommon(`roles.name.${member.role}`)}`,
                })),
              ]}
              onChange={(event) => setTargetId(event.target.value)}
            />
          )}
        </Field>

        {target && (
          <Text as={TextElement.Paragraph} kind={TextKind.Small} color={TextColor.Mute}>
            {t('general.danger.transfer.dialog.notice', { candidateName: target.name })}
          </Text>
        )}

        <Field label={t('general.danger.transfer.dialog.passwordLabel')}>
          {(control) => (
            <PasswordInput
              {...control}
              value={password}
              autoComplete="current-password"
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
