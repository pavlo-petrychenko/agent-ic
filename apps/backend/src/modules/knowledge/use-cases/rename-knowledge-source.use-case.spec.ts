import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { KnowledgeSourceStatus } from '@/modules/knowledge/constants/knowledge.constants';
import { KnowledgeSourceNotFoundError } from '@/modules/knowledge/errors/knowledge-source-not-found.error';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { RenameKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/rename-knowledge-source.use-case';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  TEST_DOCUMENT_TITLE,
  TEST_SOURCE_NEW_TITLE,
} from '@test/support/constants/knowledge-testing.constants';
import {
  createKnowledgeTestbed,
  knowledgeCtx,
  publicKnowledgeBaseId,
  publicKnowledgeSourceId,
  seedKnowledgeBase,
  seedKnowledgeDocument,
  seedKnowledgeSource,
} from '@test/support/helpers/knowledge-testing.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

describe('RenameKnowledgeSourceUseCase', () => {
  let testbed: KnowledgeTestbed;
  let renameKnowledgeSource: RenameKnowledgeSourceUseCase;
  let sources: SourcesRepository;
  let documents: DocumentsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed();
    renameKnowledgeSource = testbed.module.get(RenameKnowledgeSourceUseCase);
    sources = testbed.module.get(SourcesRepository);
    documents = testbed.module.get(DocumentsRepository);
    tenants = testbed.module.get(TenantTransactionService);
    ids = testbed.module.get(IdService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('renames a source without touching its documents', async () => {
    const workspaceId = ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);

    const view = await renameKnowledgeSource.execute(knowledgeCtx(workspaceId), {
      id: publicKnowledgeSourceId(testbed, sourceId),
      title: `  ${TEST_SOURCE_NEW_TITLE}  `,
    });
    const stored = await tenants.run(workspaceId, async () => ({
      source: await sources.findById(workspaceId, sourceId),
      document: await documents.findById(workspaceId, documentId),
    }));

    expect(view).toMatchObject({
      id: publicKnowledgeSourceId(testbed, sourceId),
      knowledgeBaseId: publicKnowledgeBaseId(testbed, knowledgeBaseId),
      title: TEST_SOURCE_NEW_TITLE,
    });
    expect(stored.source).toMatchObject({
      title: TEST_SOURCE_NEW_TITLE,
      status: KnowledgeSourceStatus.Pending,
    });
    expect(stored.document).toMatchObject({ title: TEST_DOCUMENT_TITLE });
  });

  it('refuses an unknown source', async () => {
    const workspaceId = ids.generate();
    await seedKnowledgeBase(testbed, workspaceId);

    await expect(
      renameKnowledgeSource.execute(knowledgeCtx(workspaceId), {
        id: publicKnowledgeSourceId(testbed, ids.generate()),
        title: TEST_SOURCE_NEW_TITLE,
      }),
    ).rejects.toBeInstanceOf(KnowledgeSourceNotFoundError);
  });
});
