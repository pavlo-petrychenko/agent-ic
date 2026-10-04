import { ErrorReason } from '@agent-ic/contracts';
import type {
  ForgotPasswordValues,
  LoginValues,
  ReasonFieldMap,
  ResetPasswordValues,
  ServerErrorsState,
} from '@/features/auth/typedefs/authForm.typedefs';

export enum LoginField {
  Email = 'email',
  Password = 'password',
}

export enum ResetPasswordField {
  Password = 'password',
  RepeatPassword = 'repeatPassword',
}

export const EMPTY_LOGIN_VALUES: LoginValues = { email: '', password: '' };

export const LOGIN_REASON_FIELDS: ReasonFieldMap = {
  [ErrorReason.InvalidCredentials]: LoginField.Password,
};

export const EMPTY_FORGOT_PASSWORD_VALUES: ForgotPasswordValues = { email: '' };

export const EMPTY_RESET_PASSWORD_VALUES: ResetPasswordValues = {
  password: '',
  repeatPassword: '',
};

export const NO_REASON_FIELDS: ReasonFieldMap = {};

export const RESET_LINK_REASONS: ReadonlySet<ErrorReason> = new Set([
  ErrorReason.TokenInvalid,
  ErrorReason.TokenExpired,
]);

export const NO_SERVER_ERRORS: ServerErrorsState = {
  fieldErrors: {},
  formError: null,
  formReason: null,
};
