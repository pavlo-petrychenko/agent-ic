import { Injectable } from '@nestjs/common';
import {
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
} from '@/modules/knowledge/constants/knowledge.constants';
import { KnowledgeSourceBusyError } from '@/modules/knowledge/errors/knowledge-source-busy.error';
import { KnowledgeUploadInvalidError } from '@/modules/knowledge/errors/knowledge-upload-invalid.error';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import type { KnowledgeUploadTarget } from '@/modules/knowledge/typedefs/knowledge-upload.typedefs';

@Injectable()
export class KnowledgeUploadTargetsService {
  constructor(
    private readonly sources: SourcesRepository,
    private readonly documents: DocumentsRepository,
    private readonly syncRuns: SyncRunsRepository,
  ) {}

  async findReplaceTarget(
    workspaceId: string,
    sourceId: string,
    knowledgeBaseId: string,
    options: { readonly lock: boolean },
  ): Promise<KnowledgeUploadTarget> {
    const source = options.lock
      ? await this.sources.findByIdForUpdate(workspaceId, sourceId)
      : await this.sources.findById(workspaceId, sourceId);
    if (
      source === null ||
      source.kbId !== knowledgeBaseId ||
      source.kind !== KnowledgeSourceKind.Upload
    ) {
      throw new KnowledgeUploadInvalidError();
    }
    if (source.status === KnowledgeSourceStatus.Indexing) {
      throw new KnowledgeSourceBusyError();
    }
    if ((await this.syncRuns.findActiveBySource(workspaceId, source.id)) !== null) {
      throw new KnowledgeSourceBusyError();
    }
    const document = await this.documents.findActiveBySource(workspaceId, source.id);
    if (document === null) {
      throw new KnowledgeUploadInvalidError();
    }
    return { source, document };
  }
}
