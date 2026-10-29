import { describe, expect, it } from 'vitest';
import { FLOW_SCHEMA_VERSION } from '@flow/document/constants/flow.constants';
import {
  FIRST_SCHEMA_VERSION,
  FlowV1WaitFor,
  ParseFlowFailureKind,
} from '@flow/versions/constants/version.constants';
import { parseFlow } from '@flow/versions/helpers/version.helpers';
import { flowV1DocumentSchema } from '@flow/versions/schemas/flow-v1.schema';
import { exampleFlows, faqWithHandOffFlow } from '@test/support/fixtures/example-flow.fixture';
import { toFlowV1Json } from '@test/support/fixtures/flow-v1.fixture';
import { toFlowV2, toFlowV2Json } from '@test/support/fixtures/flow-v2.fixture';

const TOPIC_ID = 'n_topic';

const roundTrip = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

describe('parseFlow', () => {
  it('reads every example flow from stored JSON', () => {
    for (const flow of exampleFlows) {
      expect(parseFlow(roundTrip(flow))).toEqual({ ok: true, flow });
    }
  });

  it('reads every example flow stored as version 2 as the upgraded flow', () => {
    for (const flow of exampleFlows) {
      expect(parseFlow(roundTrip(toFlowV2Json(flow)))).toEqual({ ok: true, flow });
    }
  });

  it('lists the issues of a version 2 flow against the version 2 schema', () => {
    const result = parseFlow({ ...toFlowV2(faqWithHandOffFlow), nodes: [{ id: 'n_1' }] });
    expect(result.ok).toBe(false);
    if (result.ok || result.failure.kind !== ParseFlowFailureKind.InvalidDocument) {
      throw new Error('expected an invalid document');
    }
    expect(result.failure.issues.map((issue) => issue.path)).toContainEqual(['nodes', 0, 'type']);
  });

  it('reads a version 1 flow as the upgraded flow', () => {
    const v1 = toFlowV1Json(faqWithHandOffFlow, {
      observerKeys: ['topic'],
      waitFor: FlowV1WaitFor.Guards,
    });
    expect(parseFlow(roundTrip(v1))).toEqual({ ok: true, flow: faqWithHandOffFlow });
  });

  it('keeps a background flag a version 1 edge already carries', () => {
    const v1 = flowV1DocumentSchema.parse(
      toFlowV1Json(faqWithHandOffFlow, { observerKeys: [], waitFor: FlowV1WaitFor.All }),
    );
    const edges = v1.edges.map((edge) =>
      edge.target === TOPIC_ID ? { ...edge, background: true } : edge,
    );
    expect(parseFlow(roundTrip({ ...v1, edges }))).toEqual({ ok: true, flow: faqWithHandOffFlow });
  });

  it.each([0, FLOW_SCHEMA_VERSION + 1, String(FLOW_SCHEMA_VERSION), null])(
    'refuses the version %s',
    (version) => {
      expect(parseFlow({ ...faqWithHandOffFlow, schemaVersion: version })).toEqual({
        ok: false,
        failure: { kind: ParseFlowFailureKind.UnsupportedVersion, version },
      });
    },
  );

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
      schemaVersion: FLOW_SCHEMA_VERSION,
      nodes: [{ id: 'n_1', key: 'x', label: 'X', position: { x: 0, y: 0 }, type: 'agent' }],
      edges: [],
    });
    expect(result.ok).toBe(false);
    if (result.ok || result.failure.kind !== ParseFlowFailureKind.InvalidDocument) {
      throw new Error('expected an invalid document');
    }
    expect(result.failure.issues.map((issue) => issue.path)).toContainEqual(['nodes', 0, 'config']);
  });

  it('lists the issues of a version 1 flow whose completion has no role', () => {
    const result = parseFlow({ ...faqWithHandOffFlow, schemaVersion: FIRST_SCHEMA_VERSION });
    expect(result.ok).toBe(false);
    if (result.ok || result.failure.kind !== ParseFlowFailureKind.InvalidDocument) {
      throw new Error('expected an invalid document');
    }
    expect(result.failure.issues.map((issue) => issue.path)).toContainEqual([
      'nodes',
      2,
      'config',
      'role',
    ]);
  });
});
