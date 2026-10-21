import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { FIRST_PROMPT_VERSION_NUMBER } from '@/modules/prompts/constants/prompt.constants';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import type { PromptFolder } from '@/modules/prompts/typedefs/prompt-folder.typedefs';
import type { PromptImport } from '@/modules/prompts/typedefs/prompt-import.typedefs';
import type { PromptVersion } from '@/modules/prompts/typedefs/prompt-version.typedefs';
import type { Prompt } from '@/modules/prompts/typedefs/prompt.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class PromptImportService {
  constructor(
    private readonly prompts: PromptsRepository,
    private readonly versions: PromptVersionsRepository,
    private readonly folders: PromptFoldersRepository,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async ensureFolder(workspaceId: string, name: string): Promise<string> {
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

  async createPrompt(workspaceId: string, prompt: PromptImport): Promise<string> {
    const now = this.clock.now();
    const promptId = this.ids.generate();
    const created: Prompt = {
      id: promptId,
      workspaceId,
      name: prompt.name,
      folderId: prompt.folderId,
      createdByUserId: prompt.authorId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    const version: PromptVersion = {
      id: this.ids.generate(),
      workspaceId,
      promptId,
      number: FIRST_PROMPT_VERSION_NUMBER,
      text: prompt.text,
      note: prompt.note,
      authorId: prompt.authorId,
      createdAt: now,
      deletedAt: null,
    };
    await this.prompts.lockNames(workspaceId);
    await this.prompts.insert(created);
    await this.versions.insert(version);
    return this.ids.toPublic(IdPrefix.Prompt, promptId);
  }
}
