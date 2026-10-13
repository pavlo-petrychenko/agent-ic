import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequestMyEmailChange } from '@/features/settings/communication/hooks/useRequestMyEmailChange';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { ProfileEmailFieldProps } from '@/features/settings/containers/ProfileEmailField/ProfileEmailField.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function ProfileEmailField({ email }: ProfileEmailFieldProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const requestMyEmailChange = useRequestMyEmailChange();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const [draft, setDraft] = useState(email);
  const [editing, setEditing] = useState(false);
  const [sending, setSending] = useState(false);
  const savedEmail = email;
  const shownEmail = editing ? draft : savedEmail;

  const startEdit = () => {
    setDraft(savedEmail);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft(savedEmail);
  };

  const submit = async () => {
    const nextEmail = draft.trim();
    if (nextEmail === '' || nextEmail === savedEmail) {
      cancelEdit();
      return;
    }
    setSending(true);
    try {
      await requestMyEmailChange(nextEmail);
      showToast({
        message: t('profile.details.email.success', { email: nextEmail }),
        tone: ToastTone.Ok,
      });
      cancelEdit();
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    } finally {
      setSending(false);
    }
  };

  return (
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
            readOnly={!editing}
            onChange={(event) => setDraft(event.target.value)}
          />
          {editing ? (
            <>
              <Button type="button" variant={ButtonVariant.Secondary} onClick={cancelEdit}>
                {t('profile.details.email.cancel')}
              </Button>
              <Button type="button" loading={sending} onClick={() => void submit()}>
                {t('profile.details.email.send')}
              </Button>
            </>
          ) : (
            <Button type="button" variant={ButtonVariant.Secondary} onClick={startEdit}>
              {t('profile.details.email.action')}
            </Button>
          )}
        </div>
      )}
    </Field>
  );
}
