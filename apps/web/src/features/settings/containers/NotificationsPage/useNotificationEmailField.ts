import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useResendNotificationEmailVerification } from '@/features/settings/communication/hooks/useResendNotificationEmailVerification';
import { useUpdateNotificationEmail } from '@/features/settings/communication/hooks/useUpdateNotificationEmail';
import { useVerifyNotificationEmail } from '@/features/settings/communication/hooks/useVerifyNotificationEmail';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { NotificationSettingsView } from '@/features/settings/typedefs/notificationSettings.typedefs';
import type { NotificationEmailFieldProps } from '@/features/settings/view/NotificationEmailField';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useNotificationEmailField(
  settings: NotificationSettingsView,
  accountEmail: string,
  verificationToken: string | null,
  onVerificationHandled: () => void,
): NotificationEmailFieldProps {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { showToast } = useToast();
  const updateEmail = useUpdateNotificationEmail();
  const resendEmailVerification = useResendNotificationEmailVerification();
  const verifyEmail = useVerifyNotificationEmail();
  const errorMessage = useErrorMessage();
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const verificationStarted = useRef(false);

  useEffect(() => {
    if (verificationToken === null || verificationStarted.current) {
      return;
    }
    verificationStarted.current = true;
    void verifyEmail(verificationToken)
      .then(() => {
        showToast({ message: t('notifications.email.verifiedSuccess'), tone: ToastTone.Ok });
      })
      .catch((error: unknown) => {
        showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
      })
      .finally(onVerificationHandled);
  }, [verificationToken, verifyEmail, onVerificationHandled, showToast, t, errorMessage]);

  const savedEmail = settings.email ?? accountEmail;
  const usingAccountEmail = settings.email === null;
  const verified = usingAccountEmail || settings.emailVerifiedAt !== null;
  const value = draft ?? savedEmail;

  const save = async () => {
    const nextEmail = value.trim();
    if (nextEmail === '' || (nextEmail === savedEmail && (usingAccountEmail || verified))) {
      return;
    }
    setSaving(true);
    try {
      await updateEmail(nextEmail);
      setDraft(null);
      showToast({
        message: t('notifications.email.verificationSent', { email: nextEmail }),
        tone: ToastTone.Ok,
      });
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    } finally {
      setSaving(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await resendEmailVerification();
      showToast({
        message: t('notifications.email.verificationSent', { email: savedEmail }),
        tone: ToastTone.Ok,
      });
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    } finally {
      setResending(false);
    }
  };

  return {
    value,
    verified,
    usingAccountEmail,
    accountEmail,
    saving,
    resending,
    onChange: (next) => setDraft(next),
    onSave: () => void save(),
    onResend: () => void resend(),
  };
}
