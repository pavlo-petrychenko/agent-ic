import { ErrorReason } from '@agent-ic/contracts';
import type {
  LoginValues,
  ReasonFieldMap,
  ServerErrorsState,
} from '@/features/auth/typedefs/authForm.typedefs';

export enum LoginField {
  Email = 'email',
  Password = 'password',
}

export const EMPTY_LOGIN_VALUES: LoginValues = { email: '', password: '' };

export const LOGIN_REASON_FIELDS: ReasonFieldMap = {
  [ErrorReason.InvalidCredentials]: LoginField.Password,
};

export const NO_SERVER_ERRORS: ServerErrorsState = {
  fieldErrors: {},
  formError: null,
  formReason: null,
};
