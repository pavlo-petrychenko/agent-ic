import { ChunkTermsRepository } from '@/modules/knowledge/repositories/chunk-terms.repository';
import { ChunksRepository } from '@/modules/knowledge/repositories/chunks.repository';
import { ConnectionsRepository } from '@/modules/knowledge/repositories/connections.repository';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { EmbeddingCacheRepository } from '@/modules/knowledge/repositories/embedding-cache.repository';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { SectionsRepository } from '@/modules/knowledge/repositories/sections.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
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
  ],
}) {}
