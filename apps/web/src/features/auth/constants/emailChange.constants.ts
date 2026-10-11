import { ErrorReason } from '@agent-ic/contracts';

export enum EmailChangeState {
  Confirming = 'confirming',
  Changed = 'changed',
  Expired = 'expired',
  Invalid = 'invalid',
  Taken = 'taken',
  Failed = 'failed',
}

export const EMAIL_CHANGE_STATES: Readonly<Partial<Record<ErrorReason, EmailChangeState>>> = {
  [ErrorReason.TokenExpired]: EmailChangeState.Expired,
  [ErrorReason.TokenInvalid]: EmailChangeState.Invalid,
  [ErrorReason.EmailTaken]: EmailChangeState.Taken,
};
