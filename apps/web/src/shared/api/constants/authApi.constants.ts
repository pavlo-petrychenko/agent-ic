export const AUTH_API_PATH = '/api/auth';

export enum AuthEndpoint {
  SignUp = '/sign-up',
  ConfirmEmail = '/confirm-email',
  Login = '/login',
  Refresh = '/refresh',
  Logout = '/logout',
  ResetPassword = '/reset-password',
}

export const AUTH_REQUEST_INIT = {
  method: 'POST',
  mode: 'same-origin',
  credentials: 'include',
} as const satisfies RequestInit;

export const EMPTY_REQUEST_BODY = {};
