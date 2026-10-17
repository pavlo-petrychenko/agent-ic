import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { UsersRepository } from '@/modules/identity';
import {
  promptVersionAuthorIds,
  toPromptVersionView,
} from '@/modules/prompts/helpers/prompt-version.helpers';
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
      latestVersionNumber: null,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    };
  }

  promptViews(prompts: readonly Prompt[], lastNumbers: ReadonlyMap<string, number>): PromptView[] {
    return prompts.map((prompt) => ({
      ...this.promptView(prompt),
      latestVersionNumber: lastNumbers.get(prompt.id) ?? null,
    }));
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

  async promptVersionViews(versions: readonly PromptVersion[]): Promise<PromptVersionView[]> {
    const names = await this.authorNames(versions);
    return versions.map((version) =>
      toPromptVersionView(version, {
        id: this.ids.toPublic(IdPrefix.PromptVersion, version.id),
        author: this.authorOf(version, names),
      }),
    );
  }

  async promptVersionView(version: PromptVersion): Promise<PromptVersionView> {
    const names = await this.authorNames([version]);
    return toPromptVersionView(version, {
      id: this.ids.toPublic(IdPrefix.PromptVersion, version.id),
      author: this.authorOf(version, names),
    });
  }

  private async authorNames(
    versions: readonly PromptVersion[],
  ): Promise<ReadonlyMap<string, string>> {
    return new Map(
      (await this.users.findNames(promptVersionAuthorIds(versions))).map((user) => [
        user.id,
        user.name,
      ]),
    );
  }

  private authorOf(
    version: PromptVersion,
    names: ReadonlyMap<string, string>,
  ): PromptVersionAuthor | null {
    if (version.authorId === null) {
      return null;
    }
    const name = names.get(version.authorId);
    return name === undefined ? null : { name };
  }
}
