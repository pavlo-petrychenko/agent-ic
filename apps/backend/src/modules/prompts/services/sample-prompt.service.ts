import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import {
  SAMPLE_PROMPTS,
  SAMPLE_PROMPT_FOLDER_NAME,
  SAMPLE_PROMPT_NOTE,
  SamplePromptKey,
} from '@/modules/agents';
import type { SamplePromptRefs } from '@/modules/agents';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import type { PromptFolder } from '@/modules/prompts/typedefs/prompt-folder.typedefs';
import type { PromptVersion } from '@/modules/prompts/typedefs/prompt-version.typedefs';
import type { Prompt } from '@/modules/prompts/typedefs/prompt.typedefs';
import type { SamplePrompt } from '@/modules/prompts/typedefs/sample-prompt.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class SamplePromptService {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly prompts: PromptsRepository,
    private readonly versions: PromptVersionsRepository,
    private readonly folders: PromptFoldersRepository,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  ensure(workspaceId: string, authorId: string): Promise<SamplePromptRefs> {
    return this.tenantTransactions.run(workspaceId, async () => {
      const folderId = await this.ensureFolder(workspaceId, SAMPLE_PROMPT_FOLDER_NAME);
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

  createAll(
    workspaceId: string,
    authorId: string,
    folderName: string,
    prompts: readonly SamplePrompt[],
  ): Promise<readonly string[]> {
    return this.tenantTransactions.run(workspaceId, async () => {
      const folderId = await this.ensureFolder(workspaceId, folderName);
      const refs: string[] = [];
      for (const prompt of prompts) {
        refs.push(await this.ensurePrompt(workspaceId, authorId, folderId, prompt));
      }
      return refs;
    });
  }

  private async ensureFolder(workspaceId: string, name: string): Promise<string> {
    const existing = await this.folders.findByName(workspaceId, name);
    if (existing !== null) {
      return existing.id;
    }
    const now = this.clock.now();
    const folder: PromptFolder = {
      id: this.ids.generate(),
      workspaceId,
      name,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await this.folders.lockNames(workspaceId);
    await this.folders.insert(folder);
    return folder.id;
  }

  private async ensurePrompt(
    workspaceId: string,
    authorId: string,
    folderId: string,
    sample: SamplePrompt,
  ): Promise<string> {
    const existing = await this.prompts.findByName(workspaceId, sample.name);
    if (existing !== null) {
      return this.ids.toPublic(IdPrefix.Prompt, existing.id);
    }
    const now = this.clock.now();
    const promptId = this.ids.generate();
    const prompt: Prompt = {
      id: promptId,
      workspaceId,
      name: sample.name,
      folderId,
      createdByUserId: authorId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    const version: PromptVersion = {
      id: this.ids.generate(),
      workspaceId,
      promptId,
      number: 1,
      text: sample.text,
      note: SAMPLE_PROMPT_NOTE,
      authorId,
      createdAt: now,
      deletedAt: null,
    };
    await this.prompts.lockNames(workspaceId);
    await this.prompts.insert(prompt);
    await this.versions.insert(version);
    return this.ids.toPublic(IdPrefix.Prompt, promptId);
  }
}
