import { describe, expect, it } from 'vitest';
import { exampleFlows, faqWithHandOffFlow } from '../fixtures/example-flow.fixture';
import { ParseFlowFailureKind } from './version.constants';
import { parseFlow } from './version.helpers';

const roundTrip = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

describe('parseFlow', () => {
  it('reads every example flow from stored JSON', () => {
    for (const flow of exampleFlows) {
      expect(parseFlow(roundTrip(flow))).toEqual({ ok: true, flow });
    }
  });

  it('refuses a version it does not know', () => {
    expect(parseFlow({ ...faqWithHandOffFlow, schemaVersion: 2 })).toEqual({
      ok: false,
      failure: { kind: ParseFlowFailureKind.UnsupportedVersion, version: 2 },
    });
  });

  it('refuses a document without a version', () => {
    expect(parseFlow({ nodes: [], edges: [] })).toEqual({
      ok: false,
      failure: { kind: ParseFlowFailureKind.UnsupportedVersion, version: null },
    });
  });

  it('refuses a value that is not an object', () => {
    expect(parseFlow('flow')).toEqual({
      ok: false,
      failure: { kind: ParseFlowFailureKind.UnsupportedVersion, version: null },
    });
  });

  it('lists the schema issues of an invalid document with their paths', () => {
    const result = parseFlow({
      schemaVersion: 1,
      nodes: [{ id: 'n_1', key: 'x', label: 'X', position: { x: 0, y: 0 }, type: 'agent' }],
      edges: [],
    });
    expect(result.ok).toBe(false);
    if (result.ok || result.failure.kind !== ParseFlowFailureKind.InvalidDocument) {
      throw new Error('expected an invalid document');
    }
    expect(result.failure.issues.map((issue) => issue.path)).toContainEqual(['nodes', 0, 'config']);
  });
});
