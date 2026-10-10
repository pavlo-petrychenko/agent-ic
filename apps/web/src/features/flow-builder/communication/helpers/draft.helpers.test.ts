import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import { FlowIssueCode, FlowIssueSeverity } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import {
  toDraftConflict,
  toSavedDraft,
} from '@/features/flow-builder/communication/helpers/draft.helpers';
import { AppError } from '@/shared/api/errors/app.error';

const ISSUE = {
  code: FlowIssueCode.NoReplyStep,
  severity: FlowIssueSeverity.Error,
  nodeId: 'trigger',
  edgeId: null,
  path: [],
  params: {},
};

const conflictError = (details: Record<string, unknown>) =>
  new AppError('The draft changed', {
    code: ErrorCode.Conflict,
    reason: ErrorReason.DraftConflict,
    details,
  });

describe('toSavedDraft', () => {
  it('takes the new revision and drops issues this client does not know', () => {
    const saved = toSavedDraft({
      revision: 5,
      issues: [ISSUE, { ...ISSUE, code: 'FROM_THE_FUTURE' }],
    });

    expect(saved).toEqual({ revision: 5, issues: [ISSUE] });
  });
});

describe('toDraftConflict', () => {
  it('reads who saved the draft and when', () => {
    expect(
      toDraftConflict(conflictError({ savedBy: 'Oksana', savedAt: '2026-10-11T09:15:00Z' })),
    ).toEqual({ savedBy: 'Oksana', savedAt: '2026-10-11T09:15:00Z' });
  });

  it('still reports a conflict without details', () => {
    expect(toDraftConflict(conflictError({}))).toEqual({ savedBy: null, savedAt: null });
  });

  it('ignores other errors', () => {
    expect(toDraftConflict(new AppError('Down', { code: ErrorCode.Internal }))).toBeNull();
  });
});
