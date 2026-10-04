import { ErrorReason, PASSWORD_MIN_LENGTH } from '@agent-ic/contracts';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { signUp } from '@/features/auth/communication/helpers/authApi.helpers';
import { CHECK_EMAIL_PATH, LOGIN_PATH } from '@/features/auth/constants/authRoute.constants';
import {
  EMPTY_SIGN_UP_VALUES,
  NO_INVITE_TOKEN,
  SIGN_UP_REASON_FIELDS,
  SignUpField,
} from '@/features/auth/constants/confirmation.constants';
import type { SignUpPageProps } from '@/features/auth/containers/SignUpPage/SignUpPage.typedefs';
import { inviteHref } from '@/features/auth/logic/helpers/invite.helpers';
import { useServerErrors } from '@/features/auth/logic/hooks/useServerErrors';
import { createSignUpSchema } from '@/features/auth/logic/schemas/signUp.schema';
import { AuthForm } from '@/features/auth/view/AuthForm';
import { AuthPanel } from '@/features/auth/view/AuthPanel';
import { EmailTakenError } from '@/features/auth/view/EmailTakenError';
import { InviteRoleNote } from '@/features/auth/view/InviteRoleNote';
import { useAppForm } from '@/shared/forms/hooks/useAppForm';
import { Namespace } from '@/shared/i18n/constants/namespace.constants';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { ButtonSize } from '@/shared/ui/Button';
import { Callout, CalloutTone } from '@/shared/ui/Callout';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/Text';
import { TextLink } from '@/shared/ui/TextLink';

export function SignUpPage({ invite = null }: SignUpPageProps) {
  const { t } = useTranslation(Namespace.Auth);
  const { t: tError } = useTranslation(Namespace.Errors);
  const { locale } = useLocale();
  const navigate = useNavigate();
  const serverErrors = useServerErrors(SIGN_UP_REASON_FIELDS);
  const form = useAppForm({
    defaultValues: EMPTY_SIGN_UP_VALUES,
    validators: {
      onSubmit: createSignUpSchema({
        name: tError('reason.INVALID_NAME'),
        email: tError('reason.INVALID_EMAIL'),
        passwordTooShort: tError('reason.PASSWORD_TOO_SHORT'),
        passwordTooLong: tError('reason.PASSWORD_TOO_LONG'),
      }),
    },
    listeners: { onChange: ({ fieldApi }) => serverErrors.clearField(fieldApi.name) },
    onSubmit: async ({ value }) => {
      try {
        await signUp({ ...value, locale, inviteToken: invite?.token ?? NO_INVITE_TOKEN });
        await navigate({ to: CHECK_EMAIL_PATH, search: { email: value.email } });
      } catch (error) {
        serverErrors.report(error);
      }
    },
  });
  const emailError =
    serverErrors.formReason === ErrorReason.EmailTaken ? (
      <EmailTakenError />
    ) : (
      (serverErrors.fieldErrors[SignUpField.Email] ?? null)
    );

  return (
    <AuthPanel
      title={
        invite === null ? t('signUp.title') : t('invite.title', { workspace: invite.workspaceName })
      }
      subtitle={
        invite === null
          ? t('signUp.subtitle')
          : t('invite.signUpSubtitle', { inviter: invite.inviterName })
      }
      footer={
        <>
          <Text as={TextElement.Span} kind={TextKind.BodySmall} color={TextColor.Mute}>
            {t('signUp.haveAccount')}
          </Text>
          <TextLink
            to={LOGIN_PATH}
            search={{ redirect: invite === null ? null : inviteHref(invite.token) }}
          >
            {invite === null ? t('signUp.logIn') : t('invite.logInToJoin')}
          </TextLink>
        </>
      }
    >
      {invite !== null && <InviteRoleNote role={invite.role} />}
      <AuthForm onSubmit={() => void form.handleSubmit()}>
        <form.AppField name={SignUpField.Name}>
          {(field) => (
            <field.TextField
              label={t('fields.name')}
              autoComplete="name"
              error={serverErrors.fieldErrors[SignUpField.Name] ?? null}
            />
          )}
        </form.AppField>
        <form.AppField name={SignUpField.Email}>
          {(field) => (
            <field.TextField
              label={invite === null ? t('fields.workEmail') : t('fields.email')}
              type="email"
              autoComplete="email"
              error={emailError}
            />
          )}
        </form.AppField>
        <form.AppField name={SignUpField.Password}>
          {(field) => (
            <field.PasswordField
              label={t('fields.password')}
              hint={t('fields.passwordHint', { count: PASSWORD_MIN_LENGTH })}
              autoComplete="new-password"
              error={serverErrors.fieldErrors[SignUpField.Password] ?? null}
            />
          )}
        </form.AppField>
        {serverErrors.formError !== null && (
          <Callout tone={CalloutTone.Err}>{serverErrors.formError}</Callout>
        )}
        <form.AppForm>
          <form.SubmitButton size={ButtonSize.Lg} fullWidth>
            {invite === null ? t('signUp.submit') : t('invite.signUpSubmit')}
          </form.SubmitButton>
        </form.AppForm>
      </AuthForm>
    </AuthPanel>
  );
}
