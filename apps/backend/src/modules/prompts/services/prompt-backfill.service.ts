import { Injectable } from '@nestjs/common';
import { AgentVersionFlowsService } from '@/modules/agents';
import {
  IMPORTED_PROMPTS_FOLDER_NAME,
  IMPORTED_PROMPT_NOTE,
  IMPORTED_STEP_KEY_SEPARATOR,
} from '@/modules/prompts/constants/prompt-backfill.constants';
import { FIRST_PROMPT_NAME_NUMBER } from '@/modules/prompts/constants/prompt.constants';
import {
  inlineStepPrompts,
  withLibraryStepPrompts,
} from '@/modules/prompts/helpers/inline-prompt.helpers';
import {
  importedPromptName,
  numberedPromptName,
} from '@/modules/prompts/helpers/prompt-name.helpers';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { PromptImportService } from '@/modules/prompts/services/prompt-import.service';
import type { InlineStepPrompt } from '@/modules/prompts/typedefs/inline-prompt.typedefs';
import type { PromptBackfillCounts } from '@/modules/prompts/typedefs/prompt-backfill.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class PromptBackfillService {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agentFlows: AgentVersionFlowsService,
    private readonly imports: PromptImportService,
    private readonly prompts: PromptsRepository,
    private readonly clock: ClockService,
  ) {}

  backfillWorkspace(workspaceId: string): Promise<PromptBackfillCounts> {
    return this.tenantTransactions.run(workspaceId, async () => {
      const versions = await this.agentFlows.listAll(workspaceId);
      const imported = new Map<string, string>();
      let versionsRewritten = 0;
      let promptsCreated = 0;
      for (const version of versions) {
        const steps = inlineStepPrompts(version.flow);
        if (steps.length === 0) {
          continue;
        }
        const folderId = await this.imports.ensureFolder(workspaceId, IMPORTED_PROMPTS_FOLDER_NAME);
        const refs = new Map<string, string>();
        for (const step of steps) {
          const key = this.stepKey(version.agentId, step);
          let ref = imported.get(key);
          if (ref === undefined) {
            ref = await this.importPrompt(workspaceId, folderId, version.agentName, step);
            imported.set(key, ref);
            promptsCreated += 1;
          }
          refs.set(step.nodeId, ref);
        }
        await this.agentFlows.replaceFlow(
          workspaceId,
          version.versionId,
          withLibraryStepPrompts(version.flow, refs),
          this.clock.now(),
        );
        versionsRewritten += 1;
      }
      return { versions: versionsRewritten, prompts: promptsCreated };
    });
  }

  private stepKey(agentId: string, step: InlineStepPrompt): string {
    return [agentId, step.nodeId, step.text].join(IMPORTED_STEP_KEY_SEPARATOR);
  }

  private async importPrompt(
    workspaceId: string,
    folderId: string,
    agentName: string,
    step: InlineStepPrompt,
  ): Promise<string> {
    const base = importedPromptName(agentName, step.nodeLabel);
    return this.imports.createPrompt(workspaceId, {
      folderId,
      name: await this.availablePromptName(workspaceId, base),
      text: step.text,
      note: IMPORTED_PROMPT_NOTE,
      authorId: null,
    });
  }

  private async availablePromptName(workspaceId: string, base: string): Promise<string> {
    let name = base;
    let number = FIRST_PROMPT_NAME_NUMBER;
    while ((await this.prompts.findByName(workspaceId, name)) !== null) {
      name = numberedPromptName(base, number);
      number += 1;
    }
    return name;
  }
}
