import { describe, expect, it } from 'vitest';
import { OutputViewKind } from '@/features/testing/constants/trace.constants';
import { formatSeconds, toOutputView } from '@/features/testing/logic/helpers/output.helpers';

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

describe('formatSeconds', () => {
  it('formats milliseconds as seconds with exactly one locale decimal', () => {
    expect(formatSeconds(2100, 'en')).toBe('2.1');
    expect(formatSeconds(2100, 'uk')).toBe('2,1');
    expect(formatSeconds(3000, 'en')).toBe('3.0');
    expect(formatSeconds(40, 'en')).toBe('0.0');
  });
});
