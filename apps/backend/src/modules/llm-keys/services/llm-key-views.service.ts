import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { UsersRepository } from '@/modules/identity';
import { LLM_KEY_AUTHOR_UNKNOWN } from '@/modules/llm-keys/constants/llm-key.constants';
import type {
  LlmKey,
  LlmKeyOption,
  LlmKeyView,
} from '@/modules/llm-keys/typedefs/llm-key.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class LlmKeyViewsService {
  constructor(
    private readonly users: UsersRepository,
    private readonly ids: IdService,
  ) {}

  async keyViews(
    keys: readonly LlmKey[],
    stepCounts: ReadonlyMap<string, number>,
  ): Promise<LlmKeyView[]> {
    const names = await this.authorNames(keys);
    return keys.map((key) => this.toView(key, names, stepCounts.get(key.id) ?? 0));
  }

  async keyView(key: LlmKey, usedBySteps: number): Promise<LlmKeyView> {
    return this.toView(key, await this.authorNames([key]), usedBySteps);
  }

  keyOptions(keys: readonly LlmKey[]): LlmKeyOption[] {
    return keys.map((key) => ({ id: this.publicId(key.id), vendor: key.vendor, name: key.name }));
  }

  private toView(key: LlmKey, names: ReadonlyMap<string, string>, usedBySteps: number): LlmKeyView {
    return {
      id: this.publicId(key.id),
      vendor: key.vendor,
      name: key.name,
      baseUrl: key.baseUrl,
      keyLast4: key.keyLast4,
      fallbackToPlatform: key.fallbackToPlatform,
      addedBy: names.get(key.createdBy) ?? LLM_KEY_AUTHOR_UNKNOWN,
      createdAt: key.createdAt,
      usedBySteps,
    };
  }

  private async authorNames(keys: readonly LlmKey[]): Promise<ReadonlyMap<string, string>> {
    const authorIds = [...new Set(keys.map(({ createdBy }) => createdBy))];
    return new Map((await this.users.findNames(authorIds)).map((user) => [user.id, user.name]));
  }

  private publicId(keyId: string): string {
    return this.ids.toPublic(IdPrefix.LlmKey, keyId);
  }
}
