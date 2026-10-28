import { ErrorReason } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { KNOWLEDGE_EMBEDDING_DIMENSIONS } from '@/modules/knowledge/constants/knowledge.constants';
import { KnowledgeBaseNameTakenError } from '@/modules/knowledge/errors/knowledge-base-name-taken.error';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { CreateKnowledgeBaseUseCase } from '@/modules/knowledge/use-cases/create-knowledge-base.use-case';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_EDITOR_ID } from '@test/support/constants/agents-testing.constants';
import {
  TEST_EMBEDDING_MODEL,
  TEST_KB_DESCRIPTION,
  TEST_KB_NAME,
  TEST_KB_TOOL_NAME,
} from '@test/support/constants/knowledge-testing.constants';
import {
  createKnowledgeTestbed,
  knowledgeCtx,
  publicKnowledgeBaseId,
} from '@test/support/helpers/knowledge-testing.helpers';
import { ensureUserRow, ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

const PADDED_NAME = `  ${TEST_KB_NAME}  `;

describe('CreateKnowledgeBaseUseCase', () => {
  let testbed: KnowledgeTestbed;
  let createKnowledgeBase: CreateKnowledgeBaseUseCase;
  let knowledgeBases: KnowledgeBasesRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed();
    createKnowledgeBase = testbed.module.get(CreateKnowledgeBaseUseCase);
    knowledgeBases = testbed.module.get(KnowledgeBasesRepository);
    tenants = testbed.module.get(TenantTransactionService);
    ids = testbed.module.get(IdService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('creates a knowledge base and returns its public view', async () => {
    const workspaceId = ids.generate();
    await ensureWorkspaceRow(testbed.module, workspaceId);
    await ensureUserRow(testbed.module, TEST_EDITOR_ID);

    const view = await createKnowledgeBase.execute(knowledgeCtx(workspaceId), {
      name: PADDED_NAME,
      description: TEST_KB_DESCRIPTION,
    });

    const stored = await tenants.run(workspaceId, () =>
      knowledgeBases.findByName(workspaceId, TEST_KB_NAME),
    );
    if (stored === null) {
      throw new Error('The created knowledge base was not stored');
    }
    expect(view).toMatchObject({
      id: publicKnowledgeBaseId(testbed, stored.id),
      name: TEST_KB_NAME,
      description: TEST_KB_DESCRIPTION,
      toolName: TEST_KB_TOOL_NAME,
      documentCount: 0,
      chunkCount: 0,
      createdAt: testbed.clock.now(),
    });
    expect(stored).toMatchObject({
      workspaceId,
      name: TEST_KB_NAME,
      description: TEST_KB_DESCRIPTION,
      toolName: TEST_KB_TOOL_NAME,
      embeddingModel: TEST_EMBEDDING_MODEL,
      embeddingDimensions: KNOWLEDGE_EMBEDDING_DIMENSIONS,
      createdByUserId: TEST_EDITOR_ID,
      deletedAt: null,
    });
  });

  it('refuses a name already used in the workspace, ignoring case', async () => {
    const workspaceId = ids.generate();
    await ensureWorkspaceRow(testbed.module, workspaceId);
    await ensureUserRow(testbed.module, TEST_EDITOR_ID);
    const ctx = knowledgeCtx(workspaceId);
    await createKnowledgeBase.execute(ctx, { name: TEST_KB_NAME });

    const attempt = createKnowledgeBase.execute(ctx, { name: TEST_KB_NAME.toUpperCase() });

    await expect(attempt).rejects.toBeInstanceOf(KnowledgeBaseNameTakenError);
    await expect(attempt).rejects.toMatchObject({
      kind: DomainErrorKind.Conflict,
      reason: ErrorReason.KnowledgeBaseNameTaken,
    });
  });
});
