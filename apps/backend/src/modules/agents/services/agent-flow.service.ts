import { hasBlockingIssues, parseFlow, validateFlow } from '@agent-ic/flow';
import type { FlowIssue, ParseFlowResult } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AgentFlowService {
  parse(json: unknown): ParseFlowResult {
    return parseFlow(json);
  }

  validate(json: unknown): readonly FlowIssue[] {
    return validateFlow(json);
  }

  hasBlockingIssues(issues: readonly FlowIssue[]): boolean {
    return hasBlockingIssues(issues);
  }
}
