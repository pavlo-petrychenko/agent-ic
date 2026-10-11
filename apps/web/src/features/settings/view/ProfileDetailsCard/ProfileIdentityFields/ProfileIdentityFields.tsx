import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { ProfileIdentityFieldsProps } from '@/features/settings/view/ProfileDetailsCard/ProfileIdentityFields/ProfileIdentityFields.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';

export function ProfileIdentityFields({
  name,
  email,
  emailDraft,
  emailEditing,
  emailSending,
  onNameChange,
  onEmailDraftChange,
  onEmailEdit,
  onEmailCancel,
  onEmailSubmit,
}: ProfileIdentityFieldsProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const shownEmail = emailEditing ? emailDraft : email;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 md:grid-cols-2">
      <Field label={t('profile.details.name.title')}>
        {(control) => (
          <Input
            {...control}
            value={name}
            placeholder={t('profile.details.name.placeholder')}
            onChange={(event) => onNameChange(event.target.value)}
          />
        )}
      </Field>
      <Field label={t('profile.details.email.title')} hint={t('profile.details.email.description')}>
        {(control) => (
          <div className="flex items-center gap-2">
            <Input
              {...control}
              className="min-w-72 max-w-full"
              type="email"
              autoComplete="email"
              value={shownEmail}
              style={{ width: `calc(${shownEmail.length}ch + var(--space-24))` }}
              placeholder={t('profile.details.email.placeholder')}
              readOnly={!emailEditing}
              onChange={(event) => onEmailDraftChange(event.target.value)}
            />
            {emailEditing ? (
              <>
                <Button type="button" variant={ButtonVariant.Secondary} onClick={onEmailCancel}>
                  {t('profile.details.email.cancel')}
                </Button>
                <Button type="button" loading={emailSending} onClick={onEmailSubmit}>
                  {t('profile.details.email.send')}
                </Button>
              </>
            ) : (
              <Button type="button" variant={ButtonVariant.Secondary} onClick={onEmailEdit}>
                {t('profile.details.email.action')}
              </Button>
            )}
          </div>
        )}
      </Field>
    </div>
  );
}
