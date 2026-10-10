import { FlowIssueCode, FlowIssueSeverity, NodeType, validateFlow } from '@agent-ic/flow';
import type { FlowIssue } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { EMPTY_FLOW } from '@/features/flow-builder/constants/flowBuilder.constants';
import { SaveState } from '@/features/flow-builder/constants/saveState.constants';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import { currentIssues, overviewIssues } from '@/features/flow-builder/logic/helpers/issue.helpers';

const issue = (code: FlowIssueCode, severity: FlowIssueSeverity, nodeId: string | null) =>
  ({ code, severity, nodeId, edgeId: null, path: [], params: {} }) satisfies FlowIssue;

const TRIGGER_ONLY_FLOW = addNode(EMPTY_FLOW, NodeType.TriggerMessage, { x: 0, y: 0 }, 'trigger');
const WARNING = issue(FlowIssueCode.PortNotConnected, FlowIssueSeverity.Warning, 'trigger');
const ERROR = issue(FlowIssueCode.MissingModel, FlowIssueSeverity.Error, 'agent');
const FLOW_ERROR = issue(FlowIssueCode.Cycle, FlowIssueSeverity.Error, null);

describe('currentIssues', () => {
  it('keeps the saved issues while nothing changed since the save', () => {
    expect(currentIssues(TRIGGER_ONLY_FLOW, SaveState.Idle, [WARNING])).toEqual([WARNING]);
  });

  it('validates the document locally while an edit is unsaved', () => {
    expect(currentIssues(TRIGGER_ONLY_FLOW, SaveState.Pending, [])).toEqual(
      validateFlow(TRIGGER_ONLY_FLOW),
    );
  });
});

describe('overviewIssues', () => {
  it('lists blocking issues first, each with the name of its step, and counts both kinds', () => {
    const flow = addNode(TRIGGER_ONLY_FLOW, NodeType.Agent, { x: 0, y: 0 }, 'agent');

    expect(overviewIssues(flow, [WARNING, ERROR, FLOW_ERROR])).toEqual({
      entries: [
        { issue: ERROR, step: 'agent' },
        { issue: FLOW_ERROR, step: null },
        { issue: WARNING, step: 'trigger_message' },
      ],
      errors: 2,
      warnings: 1,
    });
  });
});
