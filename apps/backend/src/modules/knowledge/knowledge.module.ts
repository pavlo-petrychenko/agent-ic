import { ChunkTermsRepository } from '@/modules/knowledge/repositories/chunk-terms.repository';
import { ChunksRepository } from '@/modules/knowledge/repositories/chunks.repository';
import { ConnectionsRepository } from '@/modules/knowledge/repositories/connections.repository';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { EmbeddingCacheRepository } from '@/modules/knowledge/repositories/embedding-cache.repository';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { SectionsRepository } from '@/modules/knowledge/repositories/sections.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import { CreateKnowledgeBaseResolver } from '@/modules/knowledge/resolvers/create-knowledge-base.resolver';
import { KnowledgeBasesResolver } from '@/modules/knowledge/resolvers/knowledge-bases.resolver';
import { KnowledgeBaseViewsService } from '@/modules/knowledge/services/knowledge-base-views.service';
import { CreateKnowledgeBaseUseCase } from '@/modules/knowledge/use-cases/create-knowledge-base.use-case';
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
    KnowledgeBaseViewsService,
    CreateKnowledgeBaseUseCase,
    ListKnowledgeBasesUseCase,
  ],
  resolvers: [CreateKnowledgeBaseResolver, KnowledgeBasesResolver],
}) {}
