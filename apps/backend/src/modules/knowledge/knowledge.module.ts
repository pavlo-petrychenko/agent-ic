import { IngestKnowledgeSourceProcessor } from '@/modules/knowledge/processors/ingest-knowledge-source.processor';
import { ChunkTermsRepository } from '@/modules/knowledge/repositories/chunk-terms.repository';
import { ChunksRepository } from '@/modules/knowledge/repositories/chunks.repository';
import { ConnectionsRepository } from '@/modules/knowledge/repositories/connections.repository';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { EmbeddingCacheRepository } from '@/modules/knowledge/repositories/embedding-cache.repository';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { KnowledgeStatsRepository } from '@/modules/knowledge/repositories/knowledge-stats.repository';
import { SectionsRepository } from '@/modules/knowledge/repositories/sections.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import { CreateKnowledgeBaseResolver } from '@/modules/knowledge/resolvers/create-knowledge-base.resolver';
import { DeleteKnowledgeBaseResolver } from '@/modules/knowledge/resolvers/delete-knowledge-base.resolver';
import { KnowledgeBasesResolver } from '@/modules/knowledge/resolvers/knowledge-bases.resolver';
import { KnowledgeUploadResolver } from '@/modules/knowledge/resolvers/knowledge-upload.resolver';
import { DocumentParserService } from '@/modules/knowledge/services/document-parser.service';
import { DocumentSummaryService } from '@/modules/knowledge/services/document-summary.service';
import { KnowledgeBaseViewsService } from '@/modules/knowledge/services/knowledge-base-views.service';
import { KnowledgeDocumentIngestionService } from '@/modules/knowledge/services/knowledge-document-ingestion.service';
import { KnowledgeEmbeddingService } from '@/modules/knowledge/services/knowledge-embedding.service';
import { KnowledgeSourceViewsService } from '@/modules/knowledge/services/knowledge-source-views.service';
import { ConfirmUploadUseCase } from '@/modules/knowledge/use-cases/confirm-upload.use-case';
import { CreateKnowledgeBaseUseCase } from '@/modules/knowledge/use-cases/create-knowledge-base.use-case';
import { CreateUploadUseCase } from '@/modules/knowledge/use-cases/create-upload.use-case';
import { DeleteKnowledgeBaseUseCase } from '@/modules/knowledge/use-cases/delete-knowledge-base.use-case';
import { IngestKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/ingest-knowledge-source.use-case';
import { ListKnowledgeBasesUseCase } from '@/modules/knowledge/use-cases/list-knowledge-bases.use-case';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class KnowledgeModule extends defineModule({
  providers: [
    KnowledgeBasesRepository,
    ConnectionsRepository,
    SourcesRepository,
    DocumentsRepository,
    SectionsRepository,
    ChunksRepository,
    ChunkTermsRepository,
    SyncRunsRepository,
    EmbeddingCacheRepository,
    KnowledgeStatsRepository,
    DocumentParserService,
    DocumentSummaryService,
    KnowledgeDocumentIngestionService,
    KnowledgeEmbeddingService,
    KnowledgeBaseViewsService,
    KnowledgeSourceViewsService,
    ConfirmUploadUseCase,
    CreateKnowledgeBaseUseCase,
    CreateUploadUseCase,
    DeleteKnowledgeBaseUseCase,
    IngestKnowledgeSourceUseCase,
    ListKnowledgeBasesUseCase,
  ],
  resolvers: [
    CreateKnowledgeBaseResolver,
    DeleteKnowledgeBaseResolver,
    KnowledgeBasesResolver,
    KnowledgeUploadResolver,
  ],
  processors: [IngestKnowledgeSourceProcessor],
}) {}
