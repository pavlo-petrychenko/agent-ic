import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateMyName } from '@/features/settings/communication/hooks/useUpdateMyName';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { ProfileDetailsFormProps } from '@/features/settings/containers/ProfileDetailsForm/ProfileDetailsForm.typedefs';
import { ProfileEmailField } from '@/features/settings/containers/ProfileEmailField';
import { ProfilePreferencesFields } from '@/features/settings/containers/ProfilePreferencesFields';
import { ProfileDetailsCard } from '@/features/settings/view/ProfileDetailsCard';
import { useWorkspaceShell } from '@/features/workspace';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function ProfileDetailsForm({ workspaceId }: ProfileDetailsFormProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const user = useWorkspaceShell(workspaceId).data?.user ?? null;
  const updateMyName = useUpdateMyName();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const savedName = user?.name ?? '';

  const saveName = async () => {
    const nextName = name.trim();
    if (nextName === savedName) {
      return;
    }
    setSaving(true);
    try {
      await updateMyName(nextName);
      setName(nextName);
      showToast({ message: t('profile.details.name.success'), tone: ToastTone.Ok });
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileDetailsCard saving={saving} onSave={() => void saveName()}>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 md:grid-cols-2">
        <Field label={t('profile.details.name.title')}>
          {(control) => (
            <Input
              {...control}
              value={name}
              placeholder={t('profile.details.name.placeholder')}
              onChange={(event) => setName(event.target.value)}
            />
          )}
        </Field>
        <ProfileEmailField email={user?.email ?? ''} />
      </div>
      <ProfilePreferencesFields />
    </ProfileDetailsCard>
  );
}
