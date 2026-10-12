import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { ChangePasswordCardProps } from '@/features/settings/view/ChangePasswordCard/ChangePasswordCard.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Card } from '@/shared/ui/display/Card';
import { Field } from '@/shared/ui/inputs/Field';
import { PasswordInput } from '@/shared/ui/inputs/PasswordInput';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';

export function ChangePasswordCard({
  currentPassword,
  newPassword,
  saving,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onSave,
}: ChangePasswordCardProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();
  const canSubmit = currentPassword !== '' && newPassword !== '';

  return (
    <Card>
      <Heading size={HeadingSize.H3} as={HeadingElement.H3}>
        {t('profile.password.title')}
      </Heading>
      <div className="padding-right-3">
        <form
          noValidate
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('profile.password.current')}>
              {(control) => (
                <PasswordInput
                  {...control}
                  value={currentPassword}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  showLabel={tCommon('ui.showPassword')}
                  hideLabel={tCommon('ui.hidePassword')}
                  onChange={(event) => onCurrentPasswordChange(event.target.value)}
                />
              )}
            </Field>
            <Field label={t('profile.password.new')}>
              {(control) => (
                <PasswordInput
                  {...control}
                  value={newPassword}
                  placeholder={t('profile.password.newPlaceholder')}
                  autoComplete="new-password"
                  showLabel={tCommon('ui.showPassword')}
                  hideLabel={tCommon('ui.hidePassword')}
                  onChange={(event) => onNewPasswordChange(event.target.value)}
                />
              )}
            </Field>
          </div>
          <div>
            <Button
              variant={ButtonVariant.Secondary}
              type="submit"
              loading={saving}
              disabled={!canSubmit}
            >
              {t('profile.password.action')}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
