import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { knowledgeUploadTicketEntry } from '@/modules/knowledge/constants/knowledge-upload-cache.constants';
import { KNOWLEDGE_UPLOAD_URL_TTL_SECONDS } from '@/modules/knowledge/constants/knowledge-upload.constants';
import { KnowledgeBaseNotFoundError } from '@/modules/knowledge/errors/knowledge-base-not-found.error';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import { knowledgeUploadStorageKey } from '@/modules/knowledge/helpers/knowledge-storage.helpers';
import {
  uploadFileName,
  validateUploadFile,
} from '@/modules/knowledge/helpers/knowledge-upload.helpers';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { createUploadInputSchema } from '@/modules/knowledge/schemas/knowledge-input.schema';
import { KnowledgeUploadTargetsService } from '@/modules/knowledge/services/knowledge-upload-targets.service';
import type {
  CreateUploadInput,
  CreateUploadResult,
} from '@/modules/knowledge/typedefs/knowledge-upload.typedefs';
import { CacheService } from '@/platform/cache/services/cache.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { FileStorage } from '@/platform/storage/gateways/file-storage.gateway';

@Injectable()
export class CreateUploadUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly knowledgeBases: KnowledgeBasesRepository,
    private readonly targets: KnowledgeUploadTargetsService,
    private readonly storage: FileStorage,
    private readonly cache: CacheService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: CreateUploadInput): Promise<CreateUploadResult> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.Edit,
    );
    const parsed = parseKnowledgeInput(createUploadInputSchema, input);
    const knowledgeBaseId = this.ids.fromPublic(IdPrefix.KnowledgeBase, parsed.knowledgeBaseId);
    const sourceId =
      parsed.sourceId === null || parsed.sourceId === undefined
        ? null
        : this.ids.fromPublic(IdPrefix.KnowledgeSource, parsed.sourceId);
    const fileName = uploadFileName(parsed.fileName);
    const mimeType = validateUploadFile(fileName, parsed.mimeType, parsed.sizeBytes);
    const uploadId = this.ids.generate();

    const documentId = await this.tenants.run(workspaceId, async () => {
      const knowledgeBase = await this.knowledgeBases.findById(workspaceId, knowledgeBaseId);
      if (knowledgeBase === null) {
        throw new KnowledgeBaseNotFoundError();
      }
      if (sourceId === null) {
        return this.ids.generate();
      }
      const target = await this.targets.findReplaceTarget(workspaceId, sourceId, knowledgeBase.id, {
        lock: false,
      });
      return target.document.id;
    });

    const uploadUrl = await this.storage.presignPut(
      knowledgeUploadStorageKey(workspaceId, documentId, uploadId, fileName),
      mimeType,
      KNOWLEDGE_UPLOAD_URL_TTL_SECONDS,
    );
    await this.cache.set(knowledgeUploadTicketEntry(workspaceId, documentId), {
      workspaceId,
      userId,
      knowledgeBaseId,
      documentId,
      uploadId,
      sourceId,
      fileName,
      mimeType,
      sizeBytes: parsed.sizeBytes,
    });
    return {
      documentId: this.ids.toPublic(IdPrefix.KnowledgeDocument, documentId),
      uploadUrl,
    };
  }
}
