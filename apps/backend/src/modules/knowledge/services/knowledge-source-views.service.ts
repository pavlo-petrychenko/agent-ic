import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import type { Document } from '@/modules/knowledge/typedefs/document.typedefs';
import type {
  KnowledgeSourceDocumentView,
  KnowledgeSourceView,
  Source,
} from '@/modules/knowledge/typedefs/source.typedefs';
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

  views(sources: readonly Source[]): KnowledgeSourceView[] {
    return sources.map((source) => this.view(source));
  }

  documentView(document: Document): KnowledgeSourceDocumentView {
    return {
      id: this.ids.toPublic(IdPrefix.KnowledgeDocument, document.id),
      title: document.title,
      status: document.status,
      summary: document.summary,
      errorCode: document.errorCode,
      errorMessage: document.errorMessage,
      tokenCount: document.tokenCount,
      chunkCount: document.chunkCount,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  documentViews(documents: readonly Document[]): KnowledgeSourceDocumentView[] {
    return documents.map((document) => this.documentView(document));
  }
}
