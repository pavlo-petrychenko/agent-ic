import { IdPrefix } from '@agent-ic/contracts';
import { PromptVersionKind, promptReferences } from '@agent-ic/flow';
import type { FlowDocument, PromptPin } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import type { PromptVersion } from '@/modules/prompts/typedefs/prompt-version.typedefs';
import type {
  ResolvedPrompt,
  ResolvedPrompts,
} from '@/modules/prompts/typedefs/resolved-prompt.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class PromptResolverService {
  constructor(
    private readonly versions: PromptVersionsRepository,
    private readonly ids: IdService,
  ) {}

  async resolveForFlow(workspaceId: string, flow: FlowDocument): Promise<ResolvedPrompts> {
    const resolved = new Map<string, ResolvedPrompt>();
    for (const reference of promptReferences(flow)) {
      const promptId = this.ids.tryFromPublic(IdPrefix.Prompt, reference.promptRef);
      if (promptId === null) {
        continue;
      }
      const version = await this.versionFor(workspaceId, promptId, reference.pin);
      if (version !== null) {
        resolved.set(reference.nodeId, {
          promptRef: reference.promptRef,
          versionNumber: version.number,
          text: version.text,
        });
      }
    }
    return resolved;
  }

  private versionFor(
    workspaceId: string,
    promptId: string,
    pin: PromptPin,
  ): Promise<PromptVersion | null> {
    return pin.kind === PromptVersionKind.Pinned
      ? this.versions.findByNumber(workspaceId, promptId, pin.number)
      : this.versions.findLatest(workspaceId, promptId);
  }
}
