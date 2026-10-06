import { PASSWORD_MIN_LENGTH } from '@agent-ic/contracts';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { resetPassword } from '@/features/auth/communication/helpers/authApi.helpers';
import {
  EMPTY_RESET_PASSWORD_VALUES,
  NO_REASON_FIELDS,
  RESET_LINK_REASONS,
  ResetPasswordField,
} from '@/features/auth/constants/authForm.constants';
import {
  FORGOT_PASSWORD_PATH,
  LOGIN_PATH,
  LoginNotice,
} from '@/features/auth/constants/authRoute.constants';
import type { ResetPasswordPageProps } from '@/features/auth/containers/ResetPasswordPage/ResetPasswordPage.typedefs';
import { useServerErrors } from '@/features/auth/logic/hooks/useServerErrors';
import { createResetPasswordSchema } from '@/features/auth/logic/schemas/password.schema';
import { AuthForm } from '@/features/auth/view/AuthForm';
import { AuthPanel } from '@/features/auth/view/AuthPanel';
import { useAppForm } from '@/shared/forms/hooks/useAppForm';
import { Namespace } from '@/shared/i18n/constants/namespace.constants';
import { ButtonSize } from '@/shared/ui/actions/Button';
import { TextLink } from '@/shared/ui/actions/TextLink';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';

export function ResetPasswordPage({ token }: ResetPasswordPageProps) {
  const { t } = useTranslation(Namespace.Auth);
  const { t: tError } = useTranslation(Namespace.Errors);
  const navigate = useNavigate();
  const serverErrors = useServerErrors(NO_REASON_FIELDS);
  const form = useAppForm({
    defaultValues: EMPTY_RESET_PASSWORD_VALUES,
    validators: {
      onSubmit: createResetPasswordSchema({
        tooShort: tError('reason.PASSWORD_TOO_SHORT'),
        tooLong: tError('reason.PASSWORD_TOO_LONG'),
        mismatch: t('validation.passwordsMismatch'),
      }),
    },
    listeners: { onChange: ({ fieldApi }) => serverErrors.clearField(fieldApi.name) },
    onSubmit: async ({ value }) => {
      try {
        if (token === null) {
          return;
        }
        await resetPassword(token, value.password);
        await navigate({ to: LOGIN_PATH, search: { notice: LoginNotice.PasswordChanged } });
      } catch (error) {
        serverErrors.report(error);
      }
    },
  });
  const linkFailed =
    serverErrors.formReason !== null && RESET_LINK_REASONS.has(serverErrors.formReason);
  const requestNewLink = <TextLink to={FORGOT_PASSWORD_PATH}>{t('reset.requestNewLink')}</TextLink>;

  if (token === null) {
    return (
      <AuthPanel title={t('reset.title')}>
        <Callout tone={CalloutTone.Err} action={requestNewLink}>
          {tError('reason.TOKEN_INVALID')}
        </Callout>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel title={t('reset.title')}>
      <AuthForm onSubmit={() => void form.handleSubmit()}>
        <form.AppField name={ResetPasswordField.Password}>
          {(field) => (
            <field.PasswordField
              label={t('fields.newPassword')}
              hint={t('fields.passwordHint', { count: PASSWORD_MIN_LENGTH })}
              autoComplete="new-password"
              error={serverErrors.fieldErrors[ResetPasswordField.Password] ?? null}
            />
          )}
        </form.AppField>
        <form.AppField name={ResetPasswordField.RepeatPassword}>
          {(field) => (
            <field.PasswordField label={t('fields.repeatPassword')} autoComplete="new-password" />
          )}
        </form.AppField>
        {serverErrors.formError !== null && (
          <Callout tone={CalloutTone.Err} action={linkFailed ? requestNewLink : null}>
            {serverErrors.formError}
          </Callout>
        )}
        <form.AppForm>
          <form.SubmitButton size={ButtonSize.Lg} fullWidth>
            {t('reset.submit')}
          </form.SubmitButton>
        </form.AppForm>
      </AuthForm>
    </AuthPanel>
  );
}
