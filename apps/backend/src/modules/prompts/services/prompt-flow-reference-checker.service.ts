import { IdPrefix } from '@agent-ic/contracts';
import { FlowIssueCode, PromptVersionKind, createIssue, promptReferences } from '@agent-ic/flow';
import type { FlowDocument, FlowIssue, PromptReference } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { FlowReferenceChecker } from '@/modules/agents';
import { promptBindingIssues } from '@/modules/prompts/helpers/prompt-binding.helpers';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import type { PromptVersion } from '@/modules/prompts/typedefs/prompt-version.typedefs';
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
      issues.push(...(await this.referenceIssues(workspaceId, flow, reference)));
    }
    return issues;
  }

  private async referenceIssues(
    workspaceId: string,
    flow: FlowDocument,
    reference: PromptReference,
  ): Promise<readonly FlowIssue[]> {
    const promptId = this.ids.tryFromPublic(IdPrefix.Prompt, reference.promptRef);
    const prompt = promptId === null ? null : await this.prompts.findById(workspaceId, promptId);
    if (prompt === null || promptId === null) {
      return [this.missingPromptIssue(reference)];
    }
    const version = await this.versionFor(workspaceId, promptId, reference);
    if (version === null) {
      return reference.pin.kind === PromptVersionKind.Pinned
        ? [
            createIssue(FlowIssueCode.MissingPromptVersion, {
              nodeId: reference.nodeId,
              path: PROMPT_PATH,
              params: { number: reference.pin.number },
            }),
          ]
        : [this.missingPromptIssue(reference)];
    }
    return promptBindingIssues(flow, reference, version);
  }

  private versionFor(
    workspaceId: string,
    promptId: string,
    reference: PromptReference,
  ): Promise<PromptVersion | null> {
    return reference.pin.kind === PromptVersionKind.Pinned
      ? this.versions.findByNumber(workspaceId, promptId, reference.pin.number)
      : this.versions.findLatest(workspaceId, promptId);
  }

  private missingPromptIssue(reference: PromptReference): FlowIssue {
    return createIssue(FlowIssueCode.MissingPrompt, {
      nodeId: reference.nodeId,
      path: PROMPT_PATH,
    });
  }
}
