import { describe, expect, it } from 'vitest';
import { PathSegmentKind } from '@flow/templates/constants/template.constants';
import {
  formatVariablePath,
  parseVariablePath,
  resolvePath,
} from '@flow/templates/helpers/path.helpers';

describe('parseVariablePath', () => {
  it('reads names and indexes', () => {
    expect(parseVariablePath('agent.messages[0]')).toEqual([
      { kind: PathSegmentKind.Name, name: 'agent' },
      { kind: PathSegmentKind.Name, name: 'messages' },
      { kind: PathSegmentKind.Index, index: 0 },
    ]);
  });

  it('reads a single name and trims spaces', () => {
    expect(parseVariablePath('  today ')).toEqual([{ kind: PathSegmentKind.Name, name: 'today' }]);
  });

  it.each(['', '.a', 'a.', 'a..b', 'a[x]', 'a[1', '1a', 'a b', 'a-b', '[0]'])(
    'refuses %j',
    (path) => {
      expect(parseVariablePath(path)).toBeNull();
    },
  );
});

describe('formatVariablePath', () => {
  it('writes the canonical form', () => {
    const segments = parseVariablePath(' event.items[2].sku ');
    expect(segments === null ? null : formatVariablePath(segments)).toBe('event.items[2].sku');
  });
});

describe('resolvePath', () => {
  const context = {
    guard: { reason: 'refund', score: 0 },
    agent: { messages: ['hi', 'there'] },
    event: { order: { id: 'A-1' } },
  };

  it('reads nested fields and list items', () => {
    expect(resolvePath(context, 'guard.reason')).toBe('refund');
    expect(resolvePath(context, 'guard.score')).toBe(0);
    expect(resolvePath(context, 'agent.messages[1]')).toBe('there');
    expect(resolvePath(context, 'event.order')).toEqual({ id: 'A-1' });
  });

  it('gives null for a missing value or an invalid path', () => {
    expect(resolvePath(context, 'guard.missing')).toBeNull();
    expect(resolvePath(context, 'agent.messages[5]')).toBeNull();
    expect(resolvePath(context, 'guard.reason.length')).toBeNull();
    expect(resolvePath(context, 'guard..reason')).toBeNull();
  });
});
