import { Injectable } from '@nestjs/common';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { SourceDocumentsRepository } from '@/modules/knowledge/repositories/source-documents.repository';
import type { CleanUpKnowledgeDocumentFilesJobData } from '@/modules/knowledge/typedefs/knowledge-job.typedefs';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { FileStorage } from '@/platform/storage/gateways/file-storage.gateway';

@Injectable()
export class CleanUpKnowledgeDocumentFilesUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly documents: DocumentsRepository,
    private readonly sourceDocuments: SourceDocumentsRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    { documentId }: CleanUpKnowledgeDocumentFilesJobData,
  ): Promise<void> {
    requireSystemActor(ctx);
    const workspaceId = ctx.workspaceId;
    if (workspaceId === null) {
      throw new WorkspaceAccessDeniedError();
    }
    const keys = await this.tenants.run(workspaceId, async () => {
      const document = await this.documents.findByIdIncludingDeleted(workspaceId, documentId);
      if (document === null || document.deletedAt === null) {
        return null;
      }
      const sourceIds = await this.sourceDocuments.listSourceIdsByDocumentIds(workspaceId, [
        document.id,
      ]);
      if (sourceIds.length > 0) {
        return null;
      }
      return [
        ...new Set(
          [
            document.originalStorageKey,
            document.pendingOriginalStorageKey,
            document.contentStorageKey,
          ].filter((key): key is string => key !== null),
        ),
      ];
    });
    if (keys === null) {
      return;
    }
    for (const key of keys) {
      await this.storage.delete(key);
    }
    await this.tenants.run(workspaceId, () => this.documents.deleteById(workspaceId, documentId));
  }
}
