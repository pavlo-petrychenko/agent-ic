import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import type { KnowledgeSourceView, Source } from '@/modules/knowledge/typedefs/source.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class KnowledgeSourceViewsService {
  constructor(private readonly ids: IdService) {}

  view(source: Source): KnowledgeSourceView {
    return {
      id: this.ids.toPublic(IdPrefix.KnowledgeSource, source.id),
      knowledgeBaseId: this.ids.toPublic(IdPrefix.KnowledgeBase, source.kbId),
      kind: source.kind,
      title: source.title,
      status: source.status,
      syncInterval: source.syncInterval,
      nextSyncAt: source.nextSyncAt,
      lastSyncAt: source.lastSyncAt,
      lastErrorCode: source.lastErrorCode,
      lastErrorMessage: source.lastErrorMessage,
      documentCount: source.documentCount,
      chunkCount: source.chunkCount,
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
    };
  }
}
