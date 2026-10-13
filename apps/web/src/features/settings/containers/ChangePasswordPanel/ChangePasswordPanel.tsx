import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChangeMyPassword } from '@/features/settings/communication/hooks/useChangeMyPassword';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import { ChangePasswordCard } from '@/features/settings/view/ChangePasswordCard';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { Namespace } from '@/shared/i18n/constants/namespace.constants';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function ChangePasswordPanel() {
  const { t } = useTranslation([SETTINGS_NAMESPACE, Namespace.Errors]);
  const changeMyPassword = useChangeMyPassword();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const savePassword = async () => {
    if (currentPassword === '' || newPassword === '') {
      return;
    }
    setPasswordSaving(true);
    try {
      await changeMyPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      showToast({ message: t('profile.password.success'), tone: ToastTone.Ok });
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <ChangePasswordCard
      currentPassword={currentPassword}
      newPassword={newPassword}
      saving={passwordSaving}
      onCurrentPasswordChange={setCurrentPassword}
      onNewPasswordChange={setNewPassword}
      onSave={() => void savePassword()}
    />
  );
}
