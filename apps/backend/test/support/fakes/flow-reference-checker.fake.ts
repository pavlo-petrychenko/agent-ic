import type { FlowIssue } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { FlowReferenceChecker } from '@/modules/agents/services/flow-reference-checker.service';

@Injectable()
export class FakeFlowReferenceChecker extends FlowReferenceChecker {
  issues: readonly FlowIssue[] = [];
  readonly checkedWorkspaces: string[] = [];

  check(workspaceId: string): Promise<readonly FlowIssue[]> {
    this.checkedWorkspaces.push(workspaceId);
    return Promise.resolve(this.issues);
  }
}
