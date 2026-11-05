import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  KnowledgeConnectionStatus,
  KnowledgeDocumentStatus,
  KnowledgeSourceKind,
} from '@/modules/knowledge/constants/knowledge.constants';
import { KnowledgeSourceNotFoundError } from '@/modules/knowledge/errors/knowledge-source-not-found.error';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { GetKnowledgeSourceUseCase } from '@/modules/knowledge/use-cases/get-knowledge-source.use-case';
import {
  createKnowledgeTestbed,
  knowledgeCtx,
  publicKnowledgeBaseId,
  publicKnowledgeDocumentId,
  publicKnowledgeSourceId,
  seedKnowledgeBase,
  seedKnowledgeConnection,
  seedKnowledgeDocument,
  seedKnowledgeSource,
} from '@test/support/helpers/knowledge-testing.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

describe('GetKnowledgeSourceUseCase', () => {
  let testbed: KnowledgeTestbed;
  let getKnowledgeSource: GetKnowledgeSourceUseCase;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed();
    getKnowledgeSource = testbed.module.get(GetKnowledgeSourceUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('returns the source and its linked documents', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    await testbed.tenants.run(workspaceId, () =>
      testbed.module.get(DocumentsRepository).update(workspaceId, documentId, {
        status: KnowledgeDocumentStatus.Indexed,
        summary: 'A short document summary.',
        tokenCount: 12,
        chunkCount: 2,
      }),
    );

    const detail = await getKnowledgeSource.execute(knowledgeCtx(workspaceId), {
      id: publicKnowledgeSourceId(testbed, sourceId),
    });

    expect(detail.source).toMatchObject({
      id: publicKnowledgeSourceId(testbed, sourceId),
      knowledgeBaseId: publicKnowledgeBaseId(testbed, knowledgeBaseId),
    });
    expect(detail.documents).toEqual([
      expect.objectContaining({
        id: publicKnowledgeDocumentId(testbed, documentId),
        status: KnowledgeDocumentStatus.Indexed,
        summary: 'A short document summary.',
        tokenCount: 12,
        chunkCount: 2,
      }),
    ]);
  });

  it('returns the Google connection with a source detail', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const connectionId = await seedKnowledgeConnection(testbed, workspaceId, {
      status: KnowledgeConnectionStatus.Revoked,
    });
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId, {
      kind: KnowledgeSourceKind.GoogleDocs,
      connectionId,
    });

    const detail = await getKnowledgeSource.execute(knowledgeCtx(workspaceId), {
      id: publicKnowledgeSourceId(testbed, sourceId),
    });

    expect(detail.connection).toMatchObject({
      accountEmail: 'owner@example.com',
      status: KnowledgeConnectionStatus.Revoked,
    });
  });

  it('throws when the source does not exist', async () => {
    const workspaceId = testbed.ids.generate();
    const attempt = getKnowledgeSource.execute(knowledgeCtx(workspaceId), {
      id: publicKnowledgeSourceId(testbed, testbed.ids.generate()),
    });

    await expect(attempt).rejects.toBeInstanceOf(KnowledgeSourceNotFoundError);
  });
});
