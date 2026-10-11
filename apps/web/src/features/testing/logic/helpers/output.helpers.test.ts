import { NodeType } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { OutputViewKind } from '@/features/testing/constants/trace.constants';
import {
  formatSeconds,
  toOutputView,
  toStepView,
} from '@/features/testing/logic/helpers/output.helpers';
import { RunStepStatus } from '@/shared/api/generated/schema.generated';

const step = {
  id: 'step_1',
  nodeId: 'node_1',
  status: RunStepStatus.Succeeded,
  output: { ok: true },
  errorMessage: null,
};

describe('toOutputView', () => {
  it('shows a flat object as fields, with a dash for empty values', () => {
    expect(toOutputView({ needs_human: false, reason: null }, 'en', NodeType.Completion)).toEqual({
      kind: OutputViewKind.Fields,
      fields: [
        { label: 'needs_human', value: 'false' },
        { label: 'reason', value: '—' },
      ],
    });
  });

  it('shows nested output as JSON', () => {
    expect(toOutputView({ messages: ['Hi'] }, 'en', NodeType.Agent)).toEqual({
      kind: OutputViewKind.Json,
      code: '{\n  "messages": [\n    "Hi"\n  ]\n}',
    });
  });

  it('shows nothing for a step without output', () => {
    expect(toOutputView(null, 'en', null)).toBeNull();
    expect(toOutputView({}, 'en', null)).toBeNull();
  });

  it('lists who an escalation would notify', () => {
    const escalation = { mode: 'escalate', messageIds: ['m1'], reason: 'Complaint' };

    expect(
      toOutputView({ ...escalation, wouldNotify: ['Pavlo', 'Oksana'] }, 'en', NodeType.Escalation),
    ).toEqual({
      kind: OutputViewKind.Escalation,
      recipients: 'Pavlo, Oksana',
    });
    expect(toOutputView({ ...escalation, wouldNotify: [] }, 'uk', NodeType.Escalation)).toEqual({
      kind: OutputViewKind.Escalation,
      recipients: null,
    });
  });

  it('shows another node output with wouldNotify as JSON, not as an escalation', () => {
    expect(toOutputView({ wouldNotify: ['Pavlo'] }, 'en', NodeType.ApiRequest)).toEqual({
      kind: OutputViewKind.Json,
      code: '{\n  "wouldNotify": [\n    "Pavlo"\n  ]\n}',
    });
  });
});

describe('toStepView', () => {
  it('leaves out what a send message step did inside', () => {
    expect(toStepView(step, 'en', NodeType.SendMessage)).toBeNull();
    expect(toStepView(step, 'en', NodeType.Agent)).toMatchObject({ kind: OutputViewKind.Fields });
  });

  it('shows the error of a failed step', () => {
    expect(
      toStepView(
        { ...step, status: RunStepStatus.Failed, output: null, errorMessage: 'Timed out' },
        'en',
        NodeType.Agent,
      ),
    ).toEqual({ kind: OutputViewKind.Error, message: 'Timed out' });
  });
});

describe('formatSeconds', () => {
  it('formats milliseconds as seconds with exactly one locale decimal', () => {
    expect(formatSeconds(2100, 'en')).toBe('2.1');
    expect(formatSeconds(2100, 'uk')).toBe('2,1');
    expect(formatSeconds(3000, 'en')).toBe('3.0');
    expect(formatSeconds(40, 'en')).toBe('0.0');
  });
});
