import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { AppError } from '@/shared/api/AppError';
import { mapApiFieldErrors } from '@/shared/forms/mapApiFieldErrors';

const translate = (key: string): string => `translated:${key}`;

describe('mapApiFieldErrors', () => {
  it('maps each failing field to the message of its reason', () => {
    const error = new AppError('Invalid', {
      code: ErrorCode.BadUserInput,
      fields: [
        { path: 'email', reason: ErrorReason.InvalidRequest },
        { path: 'workspaceId', reason: ErrorReason.InvalidId },
      ],
    });

    expect(mapApiFieldErrors(error, translate).fields).toEqual({
      email: 'translated:reason.INVALID_REQUEST',
      workspaceId: 'translated:reason.INVALID_ID',
    });
  });

  it('keeps the first message when a field fails more than once', () => {
    const error = new AppError('Invalid', {
      code: ErrorCode.BadUserInput,
      fields: [
        { path: 'email', reason: ErrorReason.InvalidRequest },
        { path: 'email', reason: ErrorReason.InvalidId },
      ],
    });

    expect(mapApiFieldErrors(error, translate).fields).toEqual({
      email: 'translated:reason.INVALID_REQUEST',
    });
  });

  it('returns no fields when the error has none', () => {
    const error = new AppError('Down', { code: ErrorCode.Internal });

    expect(mapApiFieldErrors(error, translate).fields).toEqual({});
  });
});
