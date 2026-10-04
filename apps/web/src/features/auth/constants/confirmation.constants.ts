import { ErrorReason } from '@agent-ic/contracts';
import type { ReasonFieldMap } from '@/features/auth/typedefs/authForm.typedefs';
import type { SignUpValues } from '@/features/auth/typedefs/confirmation.typedefs';

export enum SignUpField {
  Name = 'name',
  Email = 'email',
  Password = 'password',
}

export enum ConfirmEmailState {
  Confirming = 'confirming',
  Expired = 'expired',
  Invalid = 'invalid',
  AlreadyConfirmed = 'already-confirmed',
  BrowserMismatch = 'browser-mismatch',
  Failed = 'failed',
}

export enum CheckEmailNotice {
  NotConfirmedYet = 'not-confirmed-yet',
  Resent = 'resent',
}

export const EMPTY_SIGN_UP_VALUES: SignUpValues = { name: '', email: '', password: '' };

export const SIGN_UP_REASON_FIELDS: ReasonFieldMap = {
  [ErrorReason.EmailTaken]: SignUpField.Email,
};

export const CONFIRM_EMAIL_STATES: Readonly<Partial<Record<ErrorReason, ConfirmEmailState>>> = {
  [ErrorReason.TokenExpired]: ConfirmEmailState.Expired,
  [ErrorReason.TokenInvalid]: ConfirmEmailState.Invalid,
  [ErrorReason.EmailAlreadyConfirmed]: ConfirmEmailState.AlreadyConfirmed,
  [ErrorReason.ConfirmationBrowserMismatch]: ConfirmEmailState.BrowserMismatch,
};

export const NO_INVITE_TOKEN = null;
