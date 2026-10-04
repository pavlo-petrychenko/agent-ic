import { ErrorReason } from '@agent-ic/contracts';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logIn } from '@/features/auth/communication/helpers/authApi.helpers';
import { useLandingWorkspace } from '@/features/auth/communication/hooks/useLandingWorkspace';
import { useResendConfirmation } from '@/features/auth/communication/hooks/useResendConfirmation';
import {
  EMPTY_LOGIN_VALUES,
  LOGIN_REASON_FIELDS,
  LoginField,
} from '@/features/auth/constants/authForm.constants';
import {
  CHECK_EMAIL_PATH,
  FORGOT_PASSWORD_PATH,
  LoginNotice,
  SIGN_UP_PATH,
} from '@/features/auth/constants/authRoute.constants';
import type { LoginPageProps } from '@/features/auth/containers/LoginPage/LoginPage.typedefs';
import { useEnterApp } from '@/features/auth/logic/hooks/useEnterApp';
import { useServerErrors } from '@/features/auth/logic/hooks/useServerErrors';
import { createLoginSchema } from '@/features/auth/logic/schemas/login.schema';
import { AuthForm } from '@/features/auth/view/AuthForm';
import { AuthPanel } from '@/features/auth/view/AuthPanel';
import { UnconfirmedNotice } from '@/features/auth/view/UnconfirmedNotice';
import { useAppForm } from '@/shared/forms/hooks/useAppForm';
import { Namespace } from '@/shared/i18n/constants/namespace.constants';
import { ButtonSize } from '@/shared/ui/Button';
import { Callout, CalloutTone } from '@/shared/ui/Callout';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/Text';
import { TextLink } from '@/shared/ui/TextLink';
import styles from '@/features/auth/containers/LoginPage/LoginPage.module.scss';

export function LoginPage({ redirect, notice }: LoginPageProps) {
  const { t } = useTranslation(Namespace.Auth);
  const { t: tError } = useTranslation(Namespace.Errors);
  const enterApp = useEnterApp(useLandingWorkspace());
  const serverErrors = useServerErrors(LOGIN_REASON_FIELDS);
  const resend = useResendConfirmation();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const form = useAppForm({
    defaultValues: EMPTY_LOGIN_VALUES,
    validators: {
      onSubmit: createLoginSchema({
        email: tError('reason.INVALID_EMAIL'),
        password: t('validation.passwordRequired'),
      }),
    },
    listeners: { onChange: ({ fieldApi }) => serverErrors.clearField(fieldApi.name) },
    onSubmit: async ({ value }) => {
      try {
        await logIn(value);
        await enterApp(redirect);
      } catch (error) {
        serverErrors.report(error);
      }
    },
  });

  const unconfirmed = serverErrors.formReason === ErrorReason.EmailNotConfirmed;

  const resendConfirmation = async () => {
    const { email } = form.state.values;
    setResending(true);
    try {
      await resend({ email });
      await navigate({ to: CHECK_EMAIL_PATH, search: { email } });
    } catch (error) {
      serverErrors.report(error);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthPanel
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      footer={
        <>
          <Text as={TextElement.Span} kind={TextKind.BodySmall} color={TextColor.Mute}>
            {t('login.newHere')}
          </Text>
          <TextLink to={SIGN_UP_PATH}>{t('login.createAccount')}</TextLink>
        </>
      }
    >
      {notice === LoginNotice.PasswordChanged && (
        <Callout tone={CalloutTone.Ok}>{t('login.passwordChanged')}</Callout>
      )}
      {unconfirmed && (
        <UnconfirmedNotice
          email={form.state.values.email}
          resending={resending}
          onResend={() => void resendConfirmation()}
        />
      )}
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
        <form.AppField name={LoginField.Password}>
          {(field) => (
            <field.PasswordField
              label={t('fields.password')}
              autoComplete="current-password"
              error={serverErrors.fieldErrors[LoginField.Password] ?? null}
            />
          )}
        </form.AppField>
        <div className={styles.forgot}>
          <TextLink to={FORGOT_PASSWORD_PATH}>{t('login.forgot')}</TextLink>
        </div>
        {serverErrors.formError !== null && !unconfirmed && (
          <Callout tone={CalloutTone.Err}>{serverErrors.formError}</Callout>
        )}
        <form.AppForm>
          <form.SubmitButton size={ButtonSize.Lg} fullWidth>
            {t('login.submit')}
          </form.SubmitButton>
        </form.AppForm>
      </AuthForm>
    </AuthPanel>
  );
}
