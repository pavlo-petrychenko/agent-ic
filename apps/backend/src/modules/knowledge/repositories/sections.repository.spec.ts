import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SectionsRepository } from '@/modules/knowledge/repositories/sections.repository';
import {
  TEST_SECTION_NEW_PATH,
  TEST_SECTION_PATH,
} from '@test/support/constants/knowledge-testing.constants';
import { newSection } from '@test/support/fixtures/knowledge.fixture';
import {
  createKnowledgeTestbed,
  seedKnowledgeBase,
  seedKnowledgeDocument,
  seedKnowledgeSource,
} from '@test/support/helpers/knowledge-testing.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

describe('SectionsRepository', () => {
  let testbed: KnowledgeTestbed;
  let repository: SectionsRepository;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed();
    repository = testbed.module.get(SectionsRepository);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('stores, updates, deletes and isolates a section', async () => {
    const workspaceA = testbed.ids.generate();
    const workspaceB = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceA);
    const sourceId = await seedKnowledgeSource(testbed, workspaceA, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceA, knowledgeBaseId, sourceId);
    await ensureWorkspaceRow(testbed.module, workspaceB);

    const inserted = await testbed.tenants.run(workspaceA, () =>
      repository.insert(
        newSection(testbed.ids.generate(), workspaceA, knowledgeBaseId, documentId),
      ),
    );
    expect(inserted).toMatchObject({
      workspaceId: workspaceA,
      kbId: knowledgeBaseId,
      documentId,
      path: TEST_SECTION_PATH,
      createdAt: testbed.clock.now(),
    });

    const updated = await testbed.tenants.run(workspaceA, () =>
      repository.update(workspaceA, inserted.id, { path: TEST_SECTION_NEW_PATH }),
    );
    const seen = await testbed.tenants.run(workspaceB, async () => ({
      found: await repository.findById(workspaceA, inserted.id),
      updated: await repository.update(workspaceA, inserted.id, {
        path: TEST_SECTION_NEW_PATH,
      }),
      deleted: await repository.deleteById(workspaceA, inserted.id),
    }));
    const deleted = await testbed.tenants.run(workspaceA, () =>
      repository.deleteById(workspaceA, inserted.id),
    );
    const found = await testbed.tenants.run(workspaceA, () =>
      repository.findById(workspaceA, inserted.id),
    );

    expect(updated).toMatchObject({ path: TEST_SECTION_NEW_PATH });
    expect(seen).toEqual({ found: null, updated: null, deleted: false });
    expect(deleted).toBe(true);
    expect(found).toBeNull();
  });
});
