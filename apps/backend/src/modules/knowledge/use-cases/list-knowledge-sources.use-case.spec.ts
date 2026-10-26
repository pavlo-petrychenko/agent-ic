import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { KnowledgeSourceStatus } from '@/modules/knowledge/constants/knowledge.constants';
import { KnowledgeBaseNotFoundError } from '@/modules/knowledge/errors/knowledge-base-not-found.error';
import { ListKnowledgeSourcesUseCase } from '@/modules/knowledge/use-cases/list-knowledge-sources.use-case';
import {
  createKnowledgeTestbed,
  knowledgeCtx,
  publicKnowledgeBaseId,
  publicKnowledgeSourceId,
  seedKnowledgeBase,
  seedKnowledgeSource,
} from '@test/support/helpers/knowledge-testing.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

describe('ListKnowledgeSourcesUseCase', () => {
  let testbed: KnowledgeTestbed;
  let listKnowledgeSources: ListKnowledgeSourcesUseCase;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed();
    listKnowledgeSources = testbed.module.get(ListKnowledgeSourcesUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('lists sources of a knowledge base with public ids', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);

    const sources = await listKnowledgeSources.execute(knowledgeCtx(workspaceId), {
      knowledgeBaseId: publicKnowledgeBaseId(testbed, knowledgeBaseId),
    });

    expect(sources).toHaveLength(1);
    expect(sources[0]).toMatchObject({
      id: publicKnowledgeSourceId(testbed, sourceId),
      knowledgeBaseId: publicKnowledgeBaseId(testbed, knowledgeBaseId),
      status: KnowledgeSourceStatus.Pending,
    });
  });

  it('refuses a knowledge base of another workspace', async () => {
    const workspaceId = testbed.ids.generate();
    const otherWorkspaceId = testbed.ids.generate();
    await ensureWorkspaceRow(testbed.module, otherWorkspaceId);
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);

    const attempt = listKnowledgeSources.execute(knowledgeCtx(otherWorkspaceId), {
      knowledgeBaseId: publicKnowledgeBaseId(testbed, knowledgeBaseId),
    });

    await expect(attempt).rejects.toBeInstanceOf(KnowledgeBaseNotFoundError);
  });
});
