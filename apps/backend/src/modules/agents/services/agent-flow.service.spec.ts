import { FLOW_SCHEMA_VERSION, FlowIssueCode, ParseFlowFailureKind } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { AgentFlowService } from '@/modules/agents/services/agent-flow.service';
import { emptyFlow, triggerFlow } from '@test/support/fixtures/agents.fixture';

const UNKNOWN_SCHEMA_VERSION = FLOW_SCHEMA_VERSION + 1;

describe('AgentFlowService', () => {
  const service = new AgentFlowService();

  it('returns the issues of a flow without throwing', () => {
    const issues = service.validate(emptyFlow());

    expect(issues.map((issue) => issue.code)).toContain(FlowIssueCode.NoTrigger);
    expect(service.hasBlockingIssues(issues)).toBe(true);
  });

  it('finds no blocking issue in a flow with a trigger', () => {
    expect(service.hasBlockingIssues(service.validate(triggerFlow()))).toBe(false);
  });

  it('returns an issue for a stored flow it cannot read', () => {
    const issues = service.validate({ schemaVersion: UNKNOWN_SCHEMA_VERSION });

    expect(issues.map((issue) => issue.code)).toEqual([FlowIssueCode.UnsupportedVersion]);
    expect(service.hasBlockingIssues(issues)).toBe(true);
  });

  it('parses a stored flow and reports a failure instead of throwing', () => {
    const parsed = service.parse(triggerFlow());
    const unsupported = service.parse({ schemaVersion: UNKNOWN_SCHEMA_VERSION });

    expect(parsed).toEqual({ ok: true, flow: triggerFlow() });
    expect(unsupported).toMatchObject({
      ok: false,
      failure: { kind: ParseFlowFailureKind.UnsupportedVersion },
    });
  });
});
