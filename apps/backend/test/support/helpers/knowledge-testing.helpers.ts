import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { KnowledgeModule } from '@/modules/knowledge';
import { ChunkTermsRepository } from '@/modules/knowledge/repositories/chunk-terms.repository';
import { ChunksRepository } from '@/modules/knowledge/repositories/chunks.repository';
import { ConnectionsRepository } from '@/modules/knowledge/repositories/connections.repository';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { SectionsRepository } from '@/modules/knowledge/repositories/sections.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { CacheModule } from '@/platform/cache/cache.module';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { CryptoModule } from '@/platform/crypto/crypto.module';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { QueuesModule } from '@/platform/queues/queues.module';
import { RedisModule } from '@/platform/redis/redis.module';
import { SecretsModule } from '@/platform/secrets/secrets.module';
import { FakeFileStorage } from '@/platform/storage/gateways/file-storage.fake';
import { FileStorage } from '@/platform/storage/gateways/file-storage.gateway';
import { StorageModule } from '@/platform/storage/storage.module';
import { TEST_EDITOR_ID } from '@test/support/constants/agents-testing.constants';
import { KNOWLEDGE_TEST_START } from '@test/support/constants/knowledge-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import {
  newChunk,
  newChunkTerm,
  newConnection,
  newDocument,
  newKnowledgeBase,
  newSection,
  newSource,
} from '@test/support/fixtures/knowledge.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';
import type { ProviderOverride } from '@test/support/typedefs/test-infrastructure.typedefs';

export const createKnowledgeTestbed = async (
  overrides: readonly ProviderOverride[] = [],
): Promise<KnowledgeTestbed> => {
  const clock = new ManualClock(KNOWLEDGE_TEST_START);
  const storage = new FakeFileStorage();
  const module = await createPlatformTestingModule(
    TestRedisPrefix.Knowledge,
    [
      KnowledgeModule.forRole(Role.Api),
      StorageModule,
      RedisModule,
      CacheModule,
      CryptoModule,
      SecretsModule,
      QueuesModule.forRole(Role.Api),
    ],
    [{ token: ClockService, value: clock }, { token: FileStorage, value: storage }, ...overrides],
  );
  return {
    module,
    clock,
    tenants: module.get(TenantTransactionService),
    ids: module.get(IdService),
    storage,
  };
};

export const knowledgeCtx = (
  workspaceId: string,
  role: WorkspaceRole = WorkspaceRole.Owner,
): UseCaseCtx => workspaceCtx(TEST_EDITOR_ID, workspaceId, role);

export const publicKnowledgeBaseId = (testbed: KnowledgeTestbed, knowledgeBaseId: string): string =>
  testbed.ids.toPublic(IdPrefix.KnowledgeBase, knowledgeBaseId);

export const publicKnowledgeSourceId = (testbed: KnowledgeTestbed, sourceId: string): string =>
  testbed.ids.toPublic(IdPrefix.KnowledgeSource, sourceId);

export const publicKnowledgeConnectionId = (
  testbed: KnowledgeTestbed,
  connectionId: string,
): string => testbed.ids.toPublic(IdPrefix.KnowledgeConnection, connectionId);

export const seedKnowledgeConnection = async (
  testbed: KnowledgeTestbed,
  workspaceId: string,
  overrides: Parameters<typeof newConnection>[2] = {},
): Promise<string> => {
  await ensureWorkspaceRow(testbed.module, workspaceId);
  const connectionId = testbed.ids.generate();
  await testbed.tenants.run(workspaceId, () =>
    testbed.module
      .get(ConnectionsRepository)
      .insert(newConnection(connectionId, workspaceId, overrides)),
  );
  return connectionId;
};

export const publicKnowledgeDocumentId = (testbed: KnowledgeTestbed, documentId: string): string =>
  testbed.ids.toPublic(IdPrefix.KnowledgeDocument, documentId);

export const seedKnowledgeBase = async (
  testbed: KnowledgeTestbed,
  workspaceId: string,
): Promise<string> => {
  await ensureWorkspaceRow(testbed.module, workspaceId);
  const knowledgeBaseId = testbed.ids.generate();
  await testbed.tenants.run(workspaceId, () =>
    testbed.module
      .get(KnowledgeBasesRepository)
      .insert(newKnowledgeBase(knowledgeBaseId, workspaceId)),
  );
  return knowledgeBaseId;
};

export const seedKnowledgeSource = async (
  testbed: KnowledgeTestbed,
  workspaceId: string,
  knowledgeBaseId: string,
  overrides: Parameters<typeof newSource>[3] = {},
): Promise<string> => {
  const sourceId = testbed.ids.generate();
  await testbed.tenants.run(workspaceId, () =>
    testbed.module
      .get(SourcesRepository)
      .insert(newSource(sourceId, workspaceId, knowledgeBaseId, overrides)),
  );
  return sourceId;
};

export const seedKnowledgeDocument = async (
  testbed: KnowledgeTestbed,
  workspaceId: string,
  knowledgeBaseId: string,
  sourceId: string,
): Promise<string> => {
  const documentId = testbed.ids.generate();
  await testbed.tenants.run(workspaceId, () =>
    testbed.module
      .get(DocumentsRepository)
      .insert(newDocument(documentId, workspaceId, knowledgeBaseId, sourceId)),
  );
  return documentId;
};

export const seedKnowledgeSection = async (
  testbed: KnowledgeTestbed,
  workspaceId: string,
  knowledgeBaseId: string,
  documentId: string,
): Promise<string> => {
  const sectionId = testbed.ids.generate();
  await testbed.tenants.run(workspaceId, () =>
    testbed.module
      .get(SectionsRepository)
      .insert(newSection(sectionId, workspaceId, knowledgeBaseId, documentId)),
  );
  return sectionId;
};

export const seedKnowledgeChunk = async (
  testbed: KnowledgeTestbed,
  workspaceId: string,
  knowledgeBaseId: string,
  documentId: string,
  sectionId: string,
): Promise<string> => {
  const chunkId = testbed.ids.generate();
  await testbed.tenants.run(workspaceId, () =>
    testbed.module
      .get(ChunksRepository)
      .insert(newChunk(chunkId, workspaceId, knowledgeBaseId, documentId, sectionId)),
  );
  return chunkId;
};

export const seedKnowledgeChunkTerm = async (
  testbed: KnowledgeTestbed,
  workspaceId: string,
  knowledgeBaseId: string,
  chunkId: string,
): Promise<void> => {
  await testbed.tenants.run(workspaceId, () =>
    testbed.module
      .get(ChunkTermsRepository)
      .insert(newChunkTerm(workspaceId, knowledgeBaseId, chunkId)),
  );
};
