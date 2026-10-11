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
    expect(toOutputView({ needs_human: false, reason: null })).toEqual({
      kind: OutputViewKind.Fields,
      fields: [
        { label: 'needs_human', value: 'false' },
        { label: 'reason', value: '—' },
      ],
    });
  });

  it('shows nested output as JSON', () => {
    expect(toOutputView({ messages: ['Hi'] })).toEqual({
      kind: OutputViewKind.Json,
      code: '{\n  "messages": [\n    "Hi"\n  ]\n}',
    });
  });

  it('shows nothing for a step without output', () => {
    expect(toOutputView(null)).toBeNull();
    expect(toOutputView({})).toBeNull();
  });
});

describe('toStepView', () => {
  it('leaves out what a send message step did inside', () => {
    expect(toStepView(step, NodeType.SendMessage)).toBeNull();
    expect(toStepView(step, NodeType.Agent)).toMatchObject({ kind: OutputViewKind.Fields });
  });

  it('shows the error of a failed step', () => {
    expect(
      toStepView(
        { ...step, status: RunStepStatus.Failed, output: null, errorMessage: 'Timed out' },
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
