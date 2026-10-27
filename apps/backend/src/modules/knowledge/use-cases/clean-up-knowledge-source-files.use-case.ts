import { Injectable } from '@nestjs/common';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import type { CleanUpKnowledgeSourceFilesJobData } from '@/modules/knowledge/typedefs/knowledge-job.typedefs';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { FileStorage } from '@/platform/storage/gateways/file-storage.gateway';

@Injectable()
export class CleanUpKnowledgeSourceFilesUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly sources: SourcesRepository,
    private readonly documents: DocumentsRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute(ctx: UseCaseCtx, { sourceId }: CleanUpKnowledgeSourceFilesJobData): Promise<void> {
    requireSystemActor(ctx);
    const workspaceId = ctx.workspaceId;
    if (workspaceId === null) {
      throw new WorkspaceAccessDeniedError();
    }
    const keys = await this.tenants.run(workspaceId, async () => {
      const source = await this.sources.findByIdIncludingDeleted(workspaceId, sourceId);
      if (source === null) {
        return null;
      }
      const documents = await this.documents.listAllBySource(workspaceId, source.id);
      return [
        ...new Set(
          documents.flatMap((document) =>
            [
              document.originalStorageKey,
              document.pendingOriginalStorageKey,
              document.contentStorageKey,
            ].filter((key): key is string => key !== null),
          ),
        ),
      ];
    });
    if (keys === null) {
      return;
    }
    for (const key of keys) {
      await this.storage.delete(key);
    }
    await this.tenants.run(workspaceId, () => this.sources.deleteById(workspaceId, sourceId));
  }
}
