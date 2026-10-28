import { Injectable } from '@nestjs/common';
import type { WorkspaceDeletedInput } from '@/modules/identity';
import { knowledgeWorkspaceStoragePrefix } from '@/modules/knowledge/helpers/knowledge-storage.helpers';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { FileStorage } from '@/platform/storage/gateways/file-storage.gateway';

@Injectable()
export class CleanUpKnowledgeWorkspaceFilesUseCase {
  constructor(private readonly storage: FileStorage) {}

  async execute(ctx: UseCaseCtx, input: WorkspaceDeletedInput): Promise<void> {
    requireSystemActor(ctx);
    await this.storage.deletePrefix(knowledgeWorkspaceStoragePrefix(input.workspaceId));
  }
}
