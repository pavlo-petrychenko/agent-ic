import { ErrorReason } from '@agent-ic/contracts';

export enum InviteState {
  Loading = 'loading',
  Ready = 'ready',
  Invalid = 'invalid',
  Failed = 'failed',
}

export const INVITE_PATH = '/invite/$token';

export const INVITE_LINK_REASONS: ReadonlySet<ErrorReason> = new Set([
  ErrorReason.InviteInvalid,
  ErrorReason.InviteExpired,
]);
export const INVITE_PATH_PREFIX = '/invite/';
