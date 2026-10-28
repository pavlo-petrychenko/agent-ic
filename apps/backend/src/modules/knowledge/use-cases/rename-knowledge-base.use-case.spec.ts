import { ErrorReason } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { KnowledgeBaseNameTakenError } from '@/modules/knowledge/errors/knowledge-base-name-taken.error';
import { KnowledgeBaseNotFoundError } from '@/modules/knowledge/errors/knowledge-base-not-found.error';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { RenameKnowledgeBaseUseCase } from '@/modules/knowledge/use-cases/rename-knowledge-base.use-case';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { IdService } from '@/platform/ids/services/id.service';
import {
  TEST_KB_NAME,
  TEST_KB_NEW_NAME,
  TEST_KB_TOOL_NAME,
} from '@test/support/constants/knowledge-testing.constants';
import { newKnowledgeBase } from '@test/support/fixtures/knowledge.fixture';
import {
  createKnowledgeTestbed,
  knowledgeCtx,
  publicKnowledgeBaseId,
  seedKnowledgeBase,
} from '@test/support/helpers/knowledge-testing.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

describe('RenameKnowledgeBaseUseCase', () => {
  let testbed: KnowledgeTestbed;
  let renameKnowledgeBase: RenameKnowledgeBaseUseCase;
  let knowledgeBases: KnowledgeBasesRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed();
    renameKnowledgeBase = testbed.module.get(RenameKnowledgeBaseUseCase);
    knowledgeBases = testbed.module.get(KnowledgeBasesRepository);
    tenants = testbed.module.get(TenantTransactionService);
    ids = testbed.module.get(IdService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('renames a knowledge base and keeps its tool identity and counts', async () => {
    const workspaceId = ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    await tenants.run(workspaceId, () =>
      knowledgeBases.update(workspaceId, knowledgeBaseId, { documentCount: 2, chunkCount: 7 }),
    );

    const view = await renameKnowledgeBase.execute(knowledgeCtx(workspaceId), {
      id: publicKnowledgeBaseId(testbed, knowledgeBaseId),
      name: `  ${TEST_KB_NEW_NAME}  `,
    });
    const stored = await tenants.run(workspaceId, () =>
      knowledgeBases.findById(workspaceId, knowledgeBaseId),
    );

    expect(view).toMatchObject({
      id: publicKnowledgeBaseId(testbed, knowledgeBaseId),
      name: TEST_KB_NEW_NAME,
      toolName: TEST_KB_TOOL_NAME,
      documentCount: 2,
      chunkCount: 7,
    });
    expect(stored).toMatchObject({
      name: TEST_KB_NEW_NAME,
      toolName: TEST_KB_TOOL_NAME,
      documentCount: 2,
      chunkCount: 7,
    });
  });

  it('allows changing only the case of its own name', async () => {
    const workspaceId = ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);

    const view = await renameKnowledgeBase.execute(knowledgeCtx(workspaceId), {
      id: publicKnowledgeBaseId(testbed, knowledgeBaseId),
      name: TEST_KB_NAME.toUpperCase(),
    });

    expect(view.name).toBe(TEST_KB_NAME.toUpperCase());
  });

  it('refuses a name already used in the workspace, ignoring case', async () => {
    const workspaceId = ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const otherKnowledgeBaseId = ids.generate();
    await tenants.run(workspaceId, () =>
      knowledgeBases.insert({
        ...newKnowledgeBase(otherKnowledgeBaseId, workspaceId),
        name: 'Opening hours',
        toolName: 'search_opening_hours',
      }),
    );

    const attempt = renameKnowledgeBase.execute(knowledgeCtx(workspaceId), {
      id: publicKnowledgeBaseId(testbed, knowledgeBaseId),
      name: 'OPENING HOURS',
    });

    await expect(attempt).rejects.toBeInstanceOf(KnowledgeBaseNameTakenError);
    await expect(attempt).rejects.toMatchObject({
      kind: DomainErrorKind.Conflict,
      reason: ErrorReason.KnowledgeBaseNameTaken,
    });
  });

  it('refuses an unknown knowledge base', async () => {
    const workspaceId = ids.generate();
    await seedKnowledgeBase(testbed, workspaceId);

    await expect(
      renameKnowledgeBase.execute(knowledgeCtx(workspaceId), {
        id: publicKnowledgeBaseId(testbed, ids.generate()),
        name: TEST_KB_NEW_NAME,
      }),
    ).rejects.toBeInstanceOf(KnowledgeBaseNotFoundError);
  });
});
