import { AgentsModule, FLOW_REFERENCE_CHECKER } from '@/modules/agents';
import { WorkspacesRepository } from '@/modules/identity';
import { GoogleDriveApiGateway } from '@/modules/knowledge/gateways/google-drive-api.gateway';
import { GoogleDriveGateway } from '@/modules/knowledge/gateways/google-drive.gateway';
import { GoogleOAuthApiGateway } from '@/modules/knowledge/gateways/google-oauth-api.gateway';
import { GoogleOAuthGateway } from '@/modules/knowledge/gateways/google-oauth.gateway';
import { CleanUpWorkspaceListener } from '@/modules/knowledge/listeners/clean-up-workspace.listener';
import { CleanUpKnowledgeDocumentFilesProcessor } from '@/modules/knowledge/processors/clean-up-knowledge-document-files.processor';
import { CleanUpKnowledgeSourceFilesProcessor } from '@/modules/knowledge/processors/clean-up-knowledge-source-files.processor';
import { IngestKnowledgeSourceProcessor } from '@/modules/knowledge/processors/ingest-knowledge-source.processor';
import { ReindexKnowledgeDocumentProcessor } from '@/modules/knowledge/processors/reindex-knowledge-document.processor';
import { ScheduledKnowledgeSourceSyncProcessor } from '@/modules/knowledge/processors/scheduled-knowledge-source-sync.processor';
import { ChunkTermsRepository } from '@/modules/knowledge/repositories/chunk-terms.repository';
import { ChunksRepository } from '@/modules/knowledge/repositories/chunks.repository';
import { ConnectionsRepository } from '@/modules/knowledge/repositories/connections.repository';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { EmbeddingCacheRepository } from '@/modules/knowledge/repositories/embedding-cache.repository';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { KnowledgeSearchRepository } from '@/modules/knowledge/repositories/knowledge-search.repository';
import { KnowledgeStatsRepository } from '@/modules/knowledge/repositories/knowledge-stats.repository';
import { SectionsRepository } from '@/modules/knowledge/repositories/sections.repository';
import { SourceDocumentsRepository } from '@/modules/knowledge/repositories/source-documents.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import { CreateKnowledgeBaseResolver } from '@/modules/knowledge/resolvers/create-knowledge-base.resolver';
import { DeleteKnowledgeBaseResolver } from '@/modules/knowledge/resolvers/delete-knowledge-base.resolver';
import { DeleteKnowledgeSourceResolver } from '@/modules/knowledge/resolvers/delete-knowledge-source.resolver';
import { KnowledgeBaseUsagesResolver } from '@/modules/knowledge/resolvers/knowledge-base-usages.resolver';
import { KnowledgeBasesResolver } from '@/modules/knowledge/resolvers/knowledge-bases.resolver';
import { KnowledgeConnectionsResolver } from '@/modules/knowledge/resolvers/knowledge-connections.resolver';
import { KnowledgePickerResolver } from '@/modules/knowledge/resolvers/knowledge-picker.resolver';
import { KnowledgeSourcesResolver } from '@/modules/knowledge/resolvers/knowledge-sources.resolver';
import { KnowledgeUploadResolver } from '@/modules/knowledge/resolvers/knowledge-upload.resolver';
import { RemoveSourceDocumentResolver } from '@/modules/knowledge/resolvers/remove-source-document.resolver';
import { RenameKnowledgeBaseResolver } from '@/modules/knowledge/resolvers/rename-knowledge-base.resolver';
import { RenameKnowledgeSourceResolver } from '@/modules/knowledge/resolvers/rename-knowledge-source.resolver';
import { RetryKnowledgeSourceResolver } from '@/modules/knowledge/resolvers/retry-knowledge-source.resolver';
import { SearchKnowledgeResolver } from '@/modules/knowledge/resolvers/search-knowledge.resolver';
import { SyncKnowledgeSourceResolver } from '@/modules/knowledge/resolvers/sync-knowledge-source.resolver';
import { UpdateDocumentSummaryResolver } from '@/modules/knowledge/resolvers/update-document-summary.resolver';
import { UpdateKnowledgeBaseToolResolver } from '@/modules/knowledge/resolvers/update-knowledge-base-tool.resolver';
import { UpdateKnowledgeSourceScheduleResolver } from '@/modules/knowledge/resolvers/update-knowledge-source-schedule.resolver';
import { DocumentParserService } from '@/modules/knowledge/services/document-parser.service';
import { DocumentSummaryService } from '@/modules/knowledge/services/document-summary.service';
import { GoogleConnectionTokenService } from '@/modules/knowledge/services/google-connection-token.service';
import { GoogleDocsContentService } from '@/modules/knowledge/services/google-docs-content.service';
import { KnowledgeBaseViewsService } from '@/modules/knowledge/services/knowledge-base-views.service';
import { KnowledgeConnectionViewsService } from '@/modules/knowledge/services/knowledge-connection-views.service';
import { KnowledgeDocumentIngestionService } from '@/modules/knowledge/services/knowledge-document-ingestion.service';
import { KnowledgeDocumentReindexService } from '@/modules/knowledge/services/knowledge-document-reindex.service';
import { KnowledgeEmbeddingService } from '@/modules/knowledge/services/knowledge-embedding.service';
import { KnowledgeFlowReferenceChecker } from '@/modules/knowledge/services/knowledge-flow-reference-checker.service';
import { KnowledgeSearchService } from '@/modules/knowledge/services/knowledge-search.service';
import { KnowledgeSourceSyncService } from '@/modules/knowledge/services/knowledge-source-sync.service';
import { KnowledgeSourceViewsService } from '@/modules/knowledge/services/knowledge-source-views.service';
import { KnowledgeToolsService } from '@/modules/knowledge/services/knowledge-tools.service';
import { KnowledgeUploadTargetsService } from '@/modules/knowledge/services/knowledge-upload-targets.service';
import { KnowledgeUsageService } from '@/modules/knowledge/services/knowledge-usage.service';
import { CleanUpKnowledgeDocumentFilesUseCase } from '@/modules/knowledge/use-cases/clean-up-knowledge-document-files.use-case';
import { CleanUpKnowledgeSourceFilesUseCase } from '@/modules/knowledge/use-cases/clean-up-knowledge-source-files.use-case';
import { CleanUpKnowledgeWorkspaceFilesUseCase } from '@/modules/knowledge/use-cases/clean-up-knowledge-workspace-files.use-case';
import { CompleteGoogleConnectionUseCase } from '@/modules/knowledge/use-cases/complete-google-connection.use-case';
import { ConfirmUploadUseCase } from '@/modules/knowledge/use-cases/confirm-upload.use-case';
import { CreateGoogleDocsSourceUseCase } from '@/modules/knowledge/use-cases/create-google-docs-source.use-case';
import { CreateGooglePickerSessionUseCase } from '@/modules/knowledge/use-cases/create-google-picker-session.use-case';
import { CreateKnowledgeBaseUseCase } from '@/modules/knowledge/use-cases/create-knowledge-base.use-case';
import { CreateUploadUseCase } from '@/modules/knowledge/use-cases/create-upload.use-case';
import { DeleteKnowledgeBaseUseCase } from '@/modules/knowledge/use-cases/delete-knowledge-base.use-case';
import { DeleteKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/delete-knowledge-source.use-case';
import { DisconnectGoogleConnectionUseCase } from '@/modules/knowledge/use-cases/disconnect-google-connection.use-case';
import { GetKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/get-knowledge-source.use-case';
import { IngestKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/ingest-knowledge-source.use-case';
import { ListGoogleConnectionsUseCase } from '@/modules/knowledge/use-cases/list-google-connections.use-case';
import { ListKnowledgeBaseUsagesUseCase } from '@/modules/knowledge/use-cases/list-knowledge-base-usages.use-case';
import { ListKnowledgeBasesUseCase } from '@/modules/knowledge/use-cases/list-knowledge-bases.use-case';
import { ListKnowledgeSourcesUseCase } from '@/modules/knowledge/use-cases/list-knowledge-sources.use-case';
import { ReindexKnowledgeDocumentUseCase } from '@/modules/knowledge/use-cases/reindex-knowledge-document.use-case';
import { RemoveSourceDocumentUseCase } from '@/modules/knowledge/use-cases/remove-source-document.use-case';
import { RenameKnowledgeBaseUseCase } from '@/modules/knowledge/use-cases/rename-knowledge-base.use-case';
import { RenameKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/rename-knowledge-source.use-case';
import { RetryKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/retry-knowledge-source.use-case';
import { ScheduledKnowledgeSourceSyncUseCase } from '@/modules/knowledge/use-cases/scheduled-knowledge-source-sync.use-case';
import { SearchKnowledgeUseCase } from '@/modules/knowledge/use-cases/search-knowledge.use-case';
import { StartGoogleConnectionUseCase } from '@/modules/knowledge/use-cases/start-google-connection.use-case';
import { SyncKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/sync-knowledge-source.use-case';
import { UpdateDocumentSummaryUseCase } from '@/modules/knowledge/use-cases/update-document-summary.use-case';
import { UpdateKnowledgeBaseToolUseCase } from '@/modules/knowledge/use-cases/update-knowledge-base-tool.use-case';
import { UpdateKnowledgeSourceScheduleUseCase } from '@/modules/knowledge/use-cases/update-knowledge-source-schedule.use-case';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class KnowledgeModule extends defineModule({
  imports: [AgentsModule],
  providers: [
    KnowledgeBasesRepository,
    ConnectionsRepository,
    SourcesRepository,
    SourceDocumentsRepository,
    DocumentsRepository,
    SectionsRepository,
    ChunksRepository,
    ChunkTermsRepository,
    KnowledgeSearchRepository,
    SyncRunsRepository,
    EmbeddingCacheRepository,
    WorkspacesRepository,
    KnowledgeStatsRepository,
    DocumentParserService,
    DocumentSummaryService,
    GoogleDocsContentService,
    KnowledgeDocumentIngestionService,
    KnowledgeDocumentReindexService,
    KnowledgeEmbeddingService,
    KnowledgeSearchService,
    KnowledgeSourceSyncService,
    KnowledgeToolsService,
    KnowledgeBaseViewsService,
    KnowledgeSourceViewsService,
    KnowledgeConnectionViewsService,
    KnowledgeUsageService,
    KnowledgeFlowReferenceChecker,
    {
      provide: FLOW_REFERENCE_CHECKER,
      useExisting: KnowledgeFlowReferenceChecker,
    },
    KnowledgeUploadTargetsService,
    GoogleConnectionTokenService,
    { provide: GoogleOAuthGateway, useClass: GoogleOAuthApiGateway },
    { provide: GoogleDriveGateway, useClass: GoogleDriveApiGateway },
    CleanUpKnowledgeDocumentFilesUseCase,
    CleanUpKnowledgeSourceFilesUseCase,
    CleanUpKnowledgeWorkspaceFilesUseCase,
    CompleteGoogleConnectionUseCase,
    ConfirmUploadUseCase,
    CreateGoogleDocsSourceUseCase,
    CreateGooglePickerSessionUseCase,
    CreateKnowledgeBaseUseCase,
    CreateUploadUseCase,
    DeleteKnowledgeBaseUseCase,
    DeleteKnowledgeSourceUseCase,
    DisconnectGoogleConnectionUseCase,
    GetKnowledgeSourceUseCase,
    IngestKnowledgeSourceUseCase,
    ListGoogleConnectionsUseCase,
    ListKnowledgeBasesUseCase,
    ListKnowledgeBaseUsagesUseCase,
    ListKnowledgeSourcesUseCase,
    RenameKnowledgeBaseUseCase,
    RenameKnowledgeSourceUseCase,
    RemoveSourceDocumentUseCase,
    RetryKnowledgeSourceUseCase,
    SearchKnowledgeUseCase,
    ReindexKnowledgeDocumentUseCase,
    ScheduledKnowledgeSourceSyncUseCase,
    StartGoogleConnectionUseCase,
    SyncKnowledgeSourceUseCase,
    UpdateDocumentSummaryUseCase,
    UpdateKnowledgeBaseToolUseCase,
    UpdateKnowledgeSourceScheduleUseCase,
  ],
  resolvers: [
    CreateKnowledgeBaseResolver,
    DeleteKnowledgeBaseResolver,
    DeleteKnowledgeSourceResolver,
    KnowledgeBasesResolver,
    KnowledgeBaseUsagesResolver,
    KnowledgeConnectionsResolver,
    KnowledgePickerResolver,
    KnowledgeSourcesResolver,
    KnowledgeUploadResolver,
    RenameKnowledgeBaseResolver,
    RenameKnowledgeSourceResolver,
    RemoveSourceDocumentResolver,
    RetryKnowledgeSourceResolver,
    SearchKnowledgeResolver,
    SyncKnowledgeSourceResolver,
    UpdateDocumentSummaryResolver,
    UpdateKnowledgeBaseToolResolver,
    UpdateKnowledgeSourceScheduleResolver,
  ],
  processors: [
    CleanUpKnowledgeDocumentFilesProcessor,
    CleanUpKnowledgeSourceFilesProcessor,
    IngestKnowledgeSourceProcessor,
    ReindexKnowledgeDocumentProcessor,
    ScheduledKnowledgeSourceSyncProcessor,
  ],
  listeners: [CleanUpWorkspaceListener],
  exports: [KnowledgeToolsService],
}) {}
