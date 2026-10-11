import type { FlowDocument, FlowIssue } from '@agent-ic/flow';

export abstract class FlowReferenceChecker {
  abstract check(workspaceId: string, flow: FlowDocument): Promise<readonly FlowIssue[]>;
}
