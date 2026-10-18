import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import {
  SAMPLE_PROMPTS,
  SAMPLE_PROMPT_FOLDER_NAME,
  SAMPLE_PROMPT_NOTE,
  SamplePromptKey,
} from '@/modules/agents';
import type { SamplePromptDefinition, SamplePromptRefs } from '@/modules/agents';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { PromptImportService } from '@/modules/prompts/services/prompt-import.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class SamplePromptService {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly imports: PromptImportService,
    private readonly prompts: PromptsRepository,
    private readonly ids: IdService,
  ) {}

  ensure(workspaceId: string, authorId: string): Promise<SamplePromptRefs> {
    return this.tenantTransactions.run(workspaceId, async () => {
      const folderId = await this.imports.ensureFolder(workspaceId, SAMPLE_PROMPT_FOLDER_NAME);
      return {
        [SamplePromptKey.CafeAssistant]: await this.ensurePrompt(
          workspaceId,
          authorId,
          folderId,
          SAMPLE_PROMPTS[SamplePromptKey.CafeAssistant],
        ),
        [SamplePromptKey.IntentSort]: await this.ensurePrompt(
          workspaceId,
          authorId,
          folderId,
          SAMPLE_PROMPTS[SamplePromptKey.IntentSort],
        ),
        [SamplePromptKey.BookingHelper]: await this.ensurePrompt(
          workspaceId,
          authorId,
          folderId,
          SAMPLE_PROMPTS[SamplePromptKey.BookingHelper],
        ),
        [SamplePromptKey.BookingDetails]: await this.ensurePrompt(
          workspaceId,
          authorId,
          folderId,
          SAMPLE_PROMPTS[SamplePromptKey.BookingDetails],
        ),
        [SamplePromptKey.ComplaintCheck]: await this.ensurePrompt(
          workspaceId,
          authorId,
          folderId,
          SAMPLE_PROMPTS[SamplePromptKey.ComplaintCheck],
        ),
        [SamplePromptKey.MoodScorer]: await this.ensurePrompt(
          workspaceId,
          authorId,
          folderId,
          SAMPLE_PROMPTS[SamplePromptKey.MoodScorer],
        ),
        [SamplePromptKey.GoodbyeCheck]: await this.ensurePrompt(
          workspaceId,
          authorId,
          folderId,
          SAMPLE_PROMPTS[SamplePromptKey.GoodbyeCheck],
        ),
        [SamplePromptKey.LookUpAnswer]: await this.ensurePrompt(
          workspaceId,
          authorId,
          folderId,
          SAMPLE_PROMPTS[SamplePromptKey.LookUpAnswer],
        ),
      };
    });
  }

  private async ensurePrompt(
    workspaceId: string,
    authorId: string,
    folderId: string,
    sample: SamplePromptDefinition,
  ): Promise<string> {
    const existing = await this.prompts.findByName(workspaceId, sample.name);
    if (existing !== null) {
      return this.ids.toPublic(IdPrefix.Prompt, existing.id);
    }
    return this.imports.createPrompt(workspaceId, {
      folderId,
      name: sample.name,
      text: sample.text,
      note: SAMPLE_PROMPT_NOTE,
      authorId,
    });
  }
}
