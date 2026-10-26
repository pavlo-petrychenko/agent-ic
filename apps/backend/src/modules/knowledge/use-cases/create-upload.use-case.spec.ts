import { IdPrefix } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { knowledgeUploadTicketEntry } from '@/modules/knowledge/constants/knowledge-upload-cache.constants';
import { KnowledgeUploadInvalidError } from '@/modules/knowledge/errors/knowledge-upload-invalid.error';
import { knowledgeUploadStorageKey } from '@/modules/knowledge/helpers/knowledge-storage.helpers';
import { CreateUploadUseCase } from '@/modules/knowledge/use-cases/create-upload.use-case';
import { CacheService } from '@/platform/cache/services/cache.service';
import { TEST_EDITOR_ID } from '@test/support/constants/agents-testing.constants';
import {
  createKnowledgeTestbed,
  knowledgeCtx,
  publicKnowledgeBaseId,
  publicKnowledgeDocumentId,
  publicKnowledgeSourceId,
  seedKnowledgeBase,
  seedKnowledgeDocument,
  seedKnowledgeSource,
} from '@test/support/helpers/knowledge-testing.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

describe('CreateUploadUseCase', () => {
  let testbed: KnowledgeTestbed;
  let createUpload: CreateUploadUseCase;
  let cache: CacheService;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed();
    createUpload = testbed.module.get(CreateUploadUseCase);
    cache = testbed.module.get(CacheService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('returns a presigned PUT and stores the upload ticket', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);

    const created = await createUpload.execute(knowledgeCtx(workspaceId), {
      knowledgeBaseId: publicKnowledgeBaseId(testbed, knowledgeBaseId),
      fileName: 'C:\\fakepath\\Refunds.MD',
      mimeType: ' Text/Markdown ; charset=utf-8 ',
      sizeBytes: 100,
    });
    const documentId = testbed.ids.fromPublic(IdPrefix.KnowledgeDocument, created.documentId);
    const uploadKey = knowledgeUploadStorageKey(workspaceId, documentId, 'Refunds.MD');
    const ticket = await cache.get(knowledgeUploadTicketEntry(workspaceId, documentId));

    expect(created.uploadUrl).toContain(uploadKey);
    expect(testbed.storage.presignedPuts[0]).toEqual({
      key: uploadKey,
      contentType: 'text/markdown',
      expiresInSeconds: 900,
    });
    expect(ticket).toEqual({
      workspaceId,
      userId: TEST_EDITOR_ID,
      knowledgeBaseId,
      documentId,
      sourceId: null,
      fileName: 'Refunds.MD',
      mimeType: 'text/markdown',
      sizeBytes: 100,
    });
  });

  it('targets the existing document when replacing an upload', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);

    const created = await createUpload.execute(knowledgeCtx(workspaceId), {
      knowledgeBaseId: publicKnowledgeBaseId(testbed, knowledgeBaseId),
      sourceId: publicKnowledgeSourceId(testbed, sourceId),
      fileName: 'refunds-v2.md',
      mimeType: 'text/markdown',
      sizeBytes: 100,
    });

    expect(created.documentId).toBe(publicKnowledgeDocumentId(testbed, documentId));
  });

  it('rejects an unsupported file before presigning it', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);

    await expect(
      createUpload.execute(knowledgeCtx(workspaceId), {
        knowledgeBaseId: publicKnowledgeBaseId(testbed, knowledgeBaseId),
        fileName: 'refunds.doc',
        mimeType: 'application/msword',
        sizeBytes: 100,
      }),
    ).rejects.toBeInstanceOf(KnowledgeUploadInvalidError);
  });
});
