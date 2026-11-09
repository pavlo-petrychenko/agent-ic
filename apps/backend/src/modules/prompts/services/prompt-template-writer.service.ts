import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { TemplatePromptWriter } from '@/modules/agents';
import type {
  TemplatePromptDefinition,
  TemplatePromptRefs,
  TemplatePromptRequest,
} from '@/modules/agents';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { PromptImportService } from '@/modules/prompts/services/prompt-import.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class PromptTemplateWriter extends TemplatePromptWriter {
  constructor(
    private readonly imports: PromptImportService,
    private readonly prompts: PromptsRepository,
    private readonly ids: IdService,
  ) {
    super();
  }

  async ensure(workspaceId: string, request: TemplatePromptRequest): Promise<TemplatePromptRefs> {
    const folderId = await this.imports.ensureFolder(workspaceId, request.folderName);
    await this.prompts.lockNames(workspaceId);
    const refs: Record<string, string> = {};
    for (const prompt of request.prompts) {
      refs[prompt.key] = await this.ensurePrompt(workspaceId, folderId, request, prompt);
    }
    return refs;
  }

  private async ensurePrompt(
    workspaceId: string,
    folderId: string,
    request: TemplatePromptRequest,
    prompt: TemplatePromptDefinition,
  ): Promise<string> {
    const existing = await this.prompts.findByName(workspaceId, prompt.name);
    if (existing !== null) {
      return this.ids.toPublic(IdPrefix.Prompt, existing.id);
    }
    return this.imports.createPrompt(workspaceId, {
      folderId,
      name: prompt.name,
      text: prompt.text,
      note: request.note,
      authorId: request.authorId,
    });
  }
}
