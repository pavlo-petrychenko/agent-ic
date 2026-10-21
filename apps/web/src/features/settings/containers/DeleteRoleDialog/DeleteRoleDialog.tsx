import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { DeleteRoleDialogProps } from '@/features/settings/containers/DeleteRoleDialog/DeleteRoleDialog.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Field } from '@/shared/ui/inputs/Field';
import { Select } from '@/shared/ui/inputs/Select';
import { Dialog } from '@/shared/ui/overlays/Dialog';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function DeleteRoleDialog({
  open,
  busy,
  error,
  roleName,
  memberCount,
  replacementRoleId,
  replacementRoles,
  onOpenChange,
  onReplacementChange,
  onConfirm,
}: DeleteRoleDialogProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('roles.delete.title', { name: roleName })}
      description={t('roles.delete.subtitle')}
      closeLabel={tCommon('ui.close')}
      busy={busy}
      error={error}
      footerRight={
        <>
          <Button
            variant={ButtonVariant.Secondary}
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            {t('roles.delete.cancel')}
          </Button>
          <Button
            variant={ButtonVariant.Danger}
            loading={busy}
            disabled={replacementRoleId === ''}
            onClick={onConfirm}
          >
            {t('roles.delete.confirm')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Text kind={TextKind.BodySmall} color={TextColor.Mute}>
          {t('roles.members', { count: memberCount })}
        </Text>
        <Field label={t('roles.delete.replacementLabel')}>
          {(control) => (
            <Select
              id={control.id}
              aria-describedby={control['aria-describedby']}
              invalid={control.invalid}
              value={replacementRoleId}
              options={replacementRoles.map((role) => ({
                value: role.id,
                label: role.isSystem ? tCommon(`roles.name.${role.key}`) : (role.name ?? ''),
              }))}
              onChange={(event) => onReplacementChange(event.target.value)}
            />
          )}
        </Field>
      </div>
    </Dialog>
  );
}
