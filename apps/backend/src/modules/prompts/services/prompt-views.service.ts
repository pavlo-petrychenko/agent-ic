import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { UsersRepository } from '@/modules/identity';
import type {
  PromptVersion,
  PromptVersionAuthor,
  PromptVersionView,
} from '@/modules/prompts/typedefs/prompt-version.typedefs';
import type {
  Prompt,
  PromptDetailView,
  PromptView,
} from '@/modules/prompts/typedefs/prompt.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class PromptViewsService {
  constructor(
    private readonly users: UsersRepository,
    private readonly ids: IdService,
  ) {}

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

  async promptDetailView(
    prompt: Prompt,
    latestVersion: PromptVersion | null,
  ): Promise<PromptDetailView> {
    return {
      prompt: this.promptView(prompt),
      latestVersion: latestVersion === null ? null : await this.promptVersionView(latestVersion),
    };
  }

  async promptVersionView(version: PromptVersion): Promise<PromptVersionView> {
    return {
      id: this.ids.toPublic(IdPrefix.PromptVersion, version.id),
      number: version.number,
      text: version.text,
      note: version.note,
      author: await this.promptVersionAuthor(version.authorId),
      createdAt: version.createdAt,
    };
  }

  private async promptVersionAuthor(authorId: string | null): Promise<PromptVersionAuthor | null> {
    if (authorId === null) {
      return null;
    }
    const [author] = await this.users.findNames([authorId]);
    return author === undefined ? null : { name: author.name };
  }
}
