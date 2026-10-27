import { CleanUpWorkspaceListener } from '@/modules/knowledge/listeners/clean-up-workspace.listener';
import { CleanUpKnowledgeSourceFilesProcessor } from '@/modules/knowledge/processors/clean-up-knowledge-source-files.processor';
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
import { DeleteKnowledgeSourceResolver } from '@/modules/knowledge/resolvers/delete-knowledge-source.resolver';
import { KnowledgeBasesResolver } from '@/modules/knowledge/resolvers/knowledge-bases.resolver';
import { KnowledgeSourcesResolver } from '@/modules/knowledge/resolvers/knowledge-sources.resolver';
import { KnowledgeUploadResolver } from '@/modules/knowledge/resolvers/knowledge-upload.resolver';
import { RenameKnowledgeBaseResolver } from '@/modules/knowledge/resolvers/rename-knowledge-base.resolver';
import { RenameKnowledgeSourceResolver } from '@/modules/knowledge/resolvers/rename-knowledge-source.resolver';
import { RetryKnowledgeSourceResolver } from '@/modules/knowledge/resolvers/retry-knowledge-source.resolver';
import { DocumentParserService } from '@/modules/knowledge/services/document-parser.service';
import { DocumentSummaryService } from '@/modules/knowledge/services/document-summary.service';
import { KnowledgeBaseViewsService } from '@/modules/knowledge/services/knowledge-base-views.service';
import { KnowledgeDocumentIngestionService } from '@/modules/knowledge/services/knowledge-document-ingestion.service';
import { KnowledgeEmbeddingService } from '@/modules/knowledge/services/knowledge-embedding.service';
import { KnowledgeSourceViewsService } from '@/modules/knowledge/services/knowledge-source-views.service';
import { KnowledgeUploadTargetsService } from '@/modules/knowledge/services/knowledge-upload-targets.service';
import { CleanUpKnowledgeSourceFilesUseCase } from '@/modules/knowledge/use-cases/clean-up-knowledge-source-files.use-case';
import { CleanUpKnowledgeWorkspaceFilesUseCase } from '@/modules/knowledge/use-cases/clean-up-knowledge-workspace-files.use-case';
import { ConfirmUploadUseCase } from '@/modules/knowledge/use-cases/confirm-upload.use-case';
import { CreateKnowledgeBaseUseCase } from '@/modules/knowledge/use-cases/create-knowledge-base.use-case';
import { CreateUploadUseCase } from '@/modules/knowledge/use-cases/create-upload.use-case';
import { DeleteKnowledgeBaseUseCase } from '@/modules/knowledge/use-cases/delete-knowledge-base.use-case';
import { DeleteKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/delete-knowledge-source.use-case';
import { IngestKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/ingest-knowledge-source.use-case';
import { ListKnowledgeBasesUseCase } from '@/modules/knowledge/use-cases/list-knowledge-bases.use-case';
import { ListKnowledgeSourcesUseCase } from '@/modules/knowledge/use-cases/list-knowledge-sources.use-case';
import { RenameKnowledgeBaseUseCase } from '@/modules/knowledge/use-cases/rename-knowledge-base.use-case';
import { RenameKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/rename-knowledge-source.use-case';
import { RetryKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/retry-knowledge-source.use-case';
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
    KnowledgeUploadTargetsService,
    CleanUpKnowledgeSourceFilesUseCase,
    CleanUpKnowledgeWorkspaceFilesUseCase,
    ConfirmUploadUseCase,
    CreateKnowledgeBaseUseCase,
    CreateUploadUseCase,
    DeleteKnowledgeBaseUseCase,
    DeleteKnowledgeSourceUseCase,
    IngestKnowledgeSourceUseCase,
    ListKnowledgeBasesUseCase,
    ListKnowledgeSourcesUseCase,
    RenameKnowledgeBaseUseCase,
    RenameKnowledgeSourceUseCase,
    RetryKnowledgeSourceUseCase,
  ],
  resolvers: [
    CreateKnowledgeBaseResolver,
    DeleteKnowledgeBaseResolver,
    DeleteKnowledgeSourceResolver,
    KnowledgeBasesResolver,
    KnowledgeSourcesResolver,
    KnowledgeUploadResolver,
    RenameKnowledgeBaseResolver,
    RenameKnowledgeSourceResolver,
    RetryKnowledgeSourceResolver,
  ],
  processors: [CleanUpKnowledgeSourceFilesProcessor, IngestKnowledgeSourceProcessor],
  listeners: [CleanUpWorkspaceListener],
}) {}
