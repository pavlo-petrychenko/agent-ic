import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import type { Prompt, PromptView } from '@/modules/prompts/typedefs/prompt.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class PromptViewsService {
  constructor(private readonly ids: IdService) {}

  promptView(prompt: Prompt): PromptView {
    return {
      id: this.ids.toPublic(IdPrefix.Prompt, prompt.id),
      name: prompt.name,
      folderId: this.ids.toPublic(IdPrefix.PromptFolder, prompt.folderId),
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    };
  }

  promptViews(prompts: readonly Prompt[]): PromptView[] {
    return prompts.map((prompt) => this.promptView(prompt));
  }
}
