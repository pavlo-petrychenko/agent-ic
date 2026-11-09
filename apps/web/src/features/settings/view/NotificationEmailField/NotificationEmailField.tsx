import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { NotificationEmailFieldProps } from '@/features/settings/view/NotificationEmailField/NotificationEmailField.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/settings/view/NotificationEmailField/NotificationEmailField.module.scss';

export function NotificationEmailField({
  value,
  verified,
  usingAccountEmail,
  accountEmail,
  saving,
  resending,
  onChange,
  onSave,
  onResend,
}: NotificationEmailFieldProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const status = usingAccountEmail
    ? t('notifications.email.usingAccount', { email: accountEmail })
    : verified
      ? t('notifications.email.verified')
      : t('notifications.email.pending');

  return (
    <div className={styles.root}>
      <Field label={t('notifications.email.title')} hint={t('notifications.email.description')}>
        {(control) => (
          <div className={styles.controls}>
            <Input
              {...control}
              className={styles.input}
              type="email"
              autoComplete="email"
              value={value}
              placeholder={t('notifications.email.placeholder')}
              onChange={(event) => onChange(event.target.value)}
            />
            <Button type="button" loading={saving} onClick={onSave}>
              {t('notifications.email.save')}
            </Button>
            {!usingAccountEmail && !verified ? (
              <Button
                type="button"
                variant={ButtonVariant.Secondary}
                loading={resending}
                onClick={onResend}
              >
                {t('notifications.email.resend')}
              </Button>
            ) : null}
          </div>
        )}
      </Field>
      <Text kind={TextKind.Caption} color={TextColor.Mute}>
        {status}
      </Text>
    </div>
  );
}
