import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { KnowledgeDocumentStatus } from '@/modules/knowledge/constants/knowledge.constants';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { SourceDocumentsRepository } from '@/modules/knowledge/repositories/source-documents.repository';
import { CleanUpKnowledgeDocumentFilesUseCase } from '@/modules/knowledge/use-cases/clean-up-knowledge-document-files.use-case';
import { ClockService } from '@/platform/clock/services/clock.service';
import { workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';
import {
  createKnowledgeTestbed,
  seedKnowledgeBase,
  seedKnowledgeDocument,
  seedKnowledgeSource,
} from '@test/support/helpers/knowledge-testing.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

describe('CleanUpKnowledgeDocumentFilesUseCase', () => {
  let testbed: KnowledgeTestbed;
  let cleanUpKnowledgeDocumentFiles: CleanUpKnowledgeDocumentFilesUseCase;
  let documents: DocumentsRepository;
  let sourceDocuments: SourceDocumentsRepository;
  let clock: ClockService;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed();
    cleanUpKnowledgeDocumentFiles = testbed.module.get(CleanUpKnowledgeDocumentFilesUseCase);
    documents = testbed.module.get(DocumentsRepository);
    sourceDocuments = testbed.module.get(SourceDocumentsRepository);
    clock = testbed.module.get(ClockService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const documentKeys = (workspaceId: string, documentId: string) => {
    const prefix = `workspaces/${workspaceId}/knowledge/documents/${documentId}`;
    return {
      original: `${prefix}/original.md`,
      pending: `${prefix}/pending.md`,
      content: `${prefix}/content.md`,
    };
  };

  it('deletes the stored files and hard deletes a removed document', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    const keys = documentKeys(workspaceId, documentId);
    await testbed.storage.put(keys.original, Buffer.from('original'), 'text/markdown');
    await testbed.storage.put(keys.pending, Buffer.from('pending'), 'text/markdown');
    await testbed.storage.put(keys.content, Buffer.from('content'), 'text/markdown');
    await testbed.tenants.run(workspaceId, async () => {
      await documents.update(workspaceId, documentId, {
        status: KnowledgeDocumentStatus.Removed,
        deletedAt: clock.now(),
        originalStorageKey: keys.original,
        pendingOriginalStorageKey: keys.pending,
        contentStorageKey: keys.content,
      });
      await sourceDocuments.deleteLink(workspaceId, sourceId, documentId);
    });

    await cleanUpKnowledgeDocumentFiles.execute(workspaceSystemCtx(workspaceId), { documentId });

    const document = await testbed.tenants.run(workspaceId, () =>
      documents.findByIdIncludingDeleted(workspaceId, documentId),
    );
    expect(document).toBeNull();
    await expect(testbed.storage.head(keys.original)).resolves.toBeNull();
    await expect(testbed.storage.head(keys.pending)).resolves.toBeNull();
    await expect(testbed.storage.head(keys.content)).resolves.toBeNull();
  });

  it('keeps a document that is still linked to a source', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    const keys = documentKeys(workspaceId, documentId);
    await testbed.storage.put(keys.content, Buffer.from('content'), 'text/markdown');
    await testbed.tenants.run(workspaceId, () =>
      documents.update(workspaceId, documentId, {
        status: KnowledgeDocumentStatus.Removed,
        deletedAt: clock.now(),
        contentStorageKey: keys.content,
      }),
    );

    await cleanUpKnowledgeDocumentFiles.execute(workspaceSystemCtx(workspaceId), { documentId });

    const document = await testbed.tenants.run(workspaceId, () =>
      documents.findByIdIncludingDeleted(workspaceId, documentId),
    );
    expect(document).not.toBeNull();
    await expect(testbed.storage.head(keys.content)).resolves.not.toBeNull();
  });
});
