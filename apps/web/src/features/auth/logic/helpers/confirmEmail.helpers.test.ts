import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { ConfirmEmailState } from '@/features/auth/constants/confirmation.constants';
import { toConfirmEmailState } from '@/features/auth/logic/helpers/confirmEmail.helpers';
import { AppError } from '@/shared/api/errors/app.error';

const rejected = (code: ErrorCode, reason: ErrorReason) =>
  new AppError('Rejected', { code, reason });

describe('toConfirmEmailState', () => {
  it.each([
    [ErrorCode.BadUserInput, ErrorReason.TokenExpired, ConfirmEmailState.Expired],
    [ErrorCode.BadUserInput, ErrorReason.TokenInvalid, ConfirmEmailState.Invalid],
    [ErrorCode.Conflict, ErrorReason.EmailAlreadyConfirmed, ConfirmEmailState.AlreadyConfirmed],
    [
      ErrorCode.Forbidden,
      ErrorReason.ConfirmationBrowserMismatch,
      ConfirmEmailState.BrowserMismatch,
    ],
    [ErrorCode.LimitReached, ErrorReason.RateLimited, ConfirmEmailState.Failed],
  ])('turns %s / %s into the %s screen', (code, reason, state) => {
    expect(toConfirmEmailState(rejected(code, reason))).toBe(state);
  });

  it('treats a lost connection as a failure the user can retry', () => {
    expect(toConfirmEmailState(new TypeError('Failed to fetch'))).toBe(ConfirmEmailState.Failed);
  });
});
