import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForgotPassword } from '@/features/auth/communication/hooks/useForgotPassword';
import {
  EMPTY_FORGOT_PASSWORD_VALUES,
  LoginField,
  NO_REASON_FIELDS,
} from '@/features/auth/constants/authForm.constants';
import { LOGIN_PATH } from '@/features/auth/constants/authRoute.constants';
import { useServerErrors } from '@/features/auth/logic/hooks/useServerErrors';
import { createEmailSchema } from '@/features/auth/logic/schemas/password.schema';
import { AuthForm } from '@/features/auth/view/AuthForm';
import { AuthLinks } from '@/features/auth/view/AuthLinks';
import { AuthPanel } from '@/features/auth/view/AuthPanel';
import { useAppForm } from '@/shared/forms/hooks/useAppForm';
import { Namespace } from '@/shared/i18n/constants/namespace.constants';
import { ButtonSize } from '@/shared/ui/Button';
import { Callout, CalloutTone } from '@/shared/ui/Callout';
import { TextLink } from '@/shared/ui/TextLink';

export function ForgotPasswordPage() {
  const { t } = useTranslation(Namespace.Auth);
  const { t: tError } = useTranslation(Namespace.Errors);
  const forgotPassword = useForgotPassword();
  const serverErrors = useServerErrors(NO_REASON_FIELDS);
  const [sent, setSent] = useState(false);
  const form = useAppForm({
    defaultValues: EMPTY_FORGOT_PASSWORD_VALUES,
    validators: { onSubmit: createEmailSchema({ email: tError('reason.INVALID_EMAIL') }) },
    listeners: {
      onChange: ({ fieldApi }) => {
        serverErrors.clearField(fieldApi.name);
        setSent(false);
      },
    },
    onSubmit: async ({ value }) => {
      try {
        await forgotPassword(value.email);
        setSent(true);
      } catch (error) {
        serverErrors.report(error);
      }
    },
  });

  return (
    <AuthPanel title={t('forgot.title')} subtitle={t('forgot.subtitle')}>
      <AuthForm onSubmit={() => void form.handleSubmit()}>
        <form.AppField name={LoginField.Email}>
          {(field) => (
            <field.TextField
              label={t('fields.email')}
              type="email"
              autoComplete="email"
              error={serverErrors.fieldErrors[LoginField.Email] ?? null}
            />
          )}
        </form.AppField>
        {serverErrors.formError !== null && (
          <Callout tone={CalloutTone.Err}>{serverErrors.formError}</Callout>
        )}
        <form.AppForm>
          <form.SubmitButton size={ButtonSize.Lg} fullWidth>
            {t('forgot.submit')}
          </form.SubmitButton>
        </form.AppForm>
      </AuthForm>
      {sent && <Callout tone={CalloutTone.Ok}>{t('forgot.sent')}</Callout>}
      <AuthLinks>
        <TextLink to={LOGIN_PATH}>{t('links.backToLogin')}</TextLink>
      </AuthLinks>
    </AuthPanel>
  );
}
