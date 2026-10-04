import { ErrorReason } from '@agent-ic/contracts';
import type { ReasonFieldMap } from '@/features/auth/typedefs/authForm.typedefs';
import type { SignUpValues } from '@/features/auth/typedefs/confirmation.typedefs';

export enum SignUpField {
  Name = 'name',
  Email = 'email',
  Password = 'password',
}

export enum CheckEmailNotice {
  NotConfirmedYet = 'not-confirmed-yet',
  Resent = 'resent',
}

export const EMPTY_SIGN_UP_VALUES: SignUpValues = { name: '', email: '', password: '' };

export const SIGN_UP_REASON_FIELDS: ReasonFieldMap = {
  [ErrorReason.EmailTaken]: SignUpField.Email,
};

export const NO_INVITE_TOKEN = null;
