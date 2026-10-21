import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { CreateRoleDialogProps } from '@/features/settings/containers/CreateRoleDialog/CreateRoleDialog.typedefs';
import { useRoleMatrix } from '@/features/settings/logic/hooks/useRoleMatrix';
import { RoleMatrix } from '@/features/settings/view/RoleMatrix';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { Select } from '@/shared/ui/inputs/Select';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function CreateRoleDialog({
  open,
  busy,
  error,
  name,
  description,
  baseRole,
  baseRoles,
  permissions,
  onOpenChange,
  onNameChange,
  onDescriptionChange,
  onBaseRoleChange,
  onToggle,
  onSubmit,
}: CreateRoleDialogProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();
  const matrix = useRoleMatrix(permissions);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size={DialogSize.Lg}
      title={t('roles.create.title')}
      description={t('roles.create.subtitle')}
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
            {t('roles.create.cancel')}
          </Button>
          <Button loading={busy} disabled={name.trim().length === 0} onClick={onSubmit}>
            {t('roles.create.submit')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('roles.create.nameLabel')}>
            {(control) => (
              <Input
                id={control.id}
                aria-describedby={control['aria-describedby']}
                invalid={control.invalid}
                placeholder={t('roles.create.namePlaceholder')}
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
              />
            )}
          </Field>
          <Field label={t('roles.create.baseLabel')}>
            {(control) => (
              <Select
                id={control.id}
                aria-describedby={control['aria-describedby']}
                invalid={control.invalid}
                value={baseRole}
                options={baseRoles.map((role) => ({
                  value: role.key,
                  label: tCommon(`roles.name.${role.key}`),
                }))}
                onChange={(event) => {
                  const next = baseRoles.find((role) => role.key === event.target.value);
                  if (next !== undefined) {
                    onBaseRoleChange(next);
                  }
                }}
              />
            )}
          </Field>
        </div>
        <Field label={t('roles.create.descriptionLabel')}>
          {(control) => (
            <Input
              id={control.id}
              aria-describedby={control['aria-describedby']}
              invalid={control.invalid}
              placeholder={t('roles.create.descriptionPlaceholder')}
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
            />
          )}
        </Field>
        <div className="flex flex-col gap-2">
          <Text kind={TextKind.Caption} color={TextColor.Mute}>
            {t('roles.create.permissionsLabel')}
          </Text>
          <RoleMatrix {...matrix} onToggle={onToggle} />
        </div>
      </div>
    </Dialog>
  );
}
