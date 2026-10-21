import { IdPrefix } from '@agent-ic/contracts';
import { FlowIssueCode, PromptVersionKind, createIssue, promptReferences } from '@agent-ic/flow';
import type { FlowDocument, FlowIssue, PromptReference } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { FlowReferenceChecker } from '@/modules/agents';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { IdService } from '@/platform/ids/services/id.service';

const PROMPT_PATH = ['prompt'];

@Injectable()
export class PromptFlowReferenceChecker extends FlowReferenceChecker {
  constructor(
    private readonly prompts: PromptsRepository,
    private readonly versions: PromptVersionsRepository,
    private readonly ids: IdService,
  ) {
    super();
  }

  async check(workspaceId: string, flow: FlowDocument): Promise<readonly FlowIssue[]> {
    const issues: FlowIssue[] = [];
    for (const reference of promptReferences(flow)) {
      const issue = await this.referenceIssue(workspaceId, reference);
      if (issue !== null) {
        issues.push(issue);
      }
    }
    return issues;
  }

  private async referenceIssue(
    workspaceId: string,
    reference: PromptReference,
  ): Promise<FlowIssue | null> {
    const promptId = this.ids.tryFromPublic(IdPrefix.Prompt, reference.promptRef);
    const prompt = promptId === null ? null : await this.prompts.findById(workspaceId, promptId);
    if (prompt === null || promptId === null) {
      return this.missingPromptIssue(reference);
    }
    if (reference.pin.kind === PromptVersionKind.Pinned) {
      const version = await this.versions.findByNumber(workspaceId, promptId, reference.pin.number);
      return version === null
        ? createIssue(FlowIssueCode.MissingPromptVersion, {
            nodeId: reference.nodeId,
            path: PROMPT_PATH,
            params: { number: reference.pin.number },
          })
        : null;
    }
    const latest = await this.versions.findLatest(workspaceId, promptId);
    return latest === null ? this.missingPromptIssue(reference) : null;
  }

  private missingPromptIssue(reference: PromptReference): FlowIssue {
    return createIssue(FlowIssueCode.MissingPrompt, {
      nodeId: reference.nodeId,
      path: PROMPT_PATH,
    });
  }
}
