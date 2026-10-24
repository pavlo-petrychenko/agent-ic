import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { FIRST_PROMPT_VERSION_NUMBER } from '@/modules/prompts/constants/prompt.constants';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import type { PromptImport } from '@/modules/prompts/typedefs/prompt-import.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class PromptImportService {
  constructor(
    private readonly prompts: PromptsRepository,
    private readonly versions: PromptVersionsRepository,
    private readonly folders: PromptFoldersRepository,
    private readonly ids: IdService,
  ) {}

  async ensureFolder(workspaceId: string, name: string): Promise<string> {
    const existing = await this.folders.findByName(workspaceId, name);
    if (existing !== null) {
      return existing.id;
    }
    await this.folders.lockNames(workspaceId);
    const folder = await this.folders.insert({ id: this.ids.generate(), workspaceId, name });
    return folder.id;
  }

  async createPrompt(workspaceId: string, prompt: PromptImport): Promise<string> {
    const promptId = this.ids.generate();
    await this.prompts.lockNames(workspaceId);
    await this.prompts.insert({
      id: promptId,
      workspaceId,
      name: prompt.name,
      folderId: prompt.folderId,
      createdByUserId: prompt.authorId,
    });
    await this.versions.insert({
      id: this.ids.generate(),
      workspaceId,
      promptId,
      number: FIRST_PROMPT_VERSION_NUMBER,
      text: prompt.text,
      note: prompt.note,
      authorId: prompt.authorId,
    });
    return this.ids.toPublic(IdPrefix.Prompt, promptId);
  }
}
