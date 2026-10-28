import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { knowledgeWorkspaceStoragePrefix } from '@/modules/knowledge/helpers/knowledge-storage.helpers';
import { CleanUpKnowledgeWorkspaceFilesUseCase } from '@/modules/knowledge/use-cases/clean-up-knowledge-workspace-files.use-case';
import { SystemActorRequiredError } from '@/platform/context/errors/system-actor-required.error';
import { systemCtx, userCtx } from '@test/support/fixtures/identity.fixture';
import {
  createKnowledgeTestbed,
  seedKnowledgeBase,
} from '@test/support/helpers/knowledge-testing.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

describe('CleanUpKnowledgeWorkspaceFilesUseCase', () => {
  let testbed: KnowledgeTestbed;
  let cleanUp: CleanUpKnowledgeWorkspaceFilesUseCase;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed();
    cleanUp = testbed.module.get(CleanUpKnowledgeWorkspaceFilesUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('deletes every knowledge file of the workspace and keeps the others', async () => {
    const workspaceId = testbed.ids.generate();
    const otherWorkspaceId = testbed.ids.generate();
    await seedKnowledgeBase(testbed, workspaceId);
    await seedKnowledgeBase(testbed, otherWorkspaceId);
    const prefix = knowledgeWorkspaceStoragePrefix(workspaceId);
    const otherPrefix = knowledgeWorkspaceStoragePrefix(otherWorkspaceId);
    await testbed.storage.put(
      `${prefix}uploads/document/original.pdf`,
      Buffer.from('one'),
      'application/pdf',
    );
    await testbed.storage.put(
      `${prefix}documents/document/content-1.md`,
      Buffer.from('two'),
      'text/markdown',
    );
    await testbed.storage.put(
      `${otherPrefix}uploads/document/original.pdf`,
      Buffer.from('three'),
      'application/pdf',
    );

    await cleanUp.execute(systemCtx(), { workspaceId });

    await expect(
      testbed.storage.head(`${prefix}uploads/document/original.pdf`),
    ).resolves.toBeNull();
    await expect(
      testbed.storage.head(`${prefix}documents/document/content-1.md`),
    ).resolves.toBeNull();
    await expect(
      testbed.storage.head(`${otherPrefix}uploads/document/original.pdf`),
    ).resolves.toMatchObject({ key: `${otherPrefix}uploads/document/original.pdf` });
  });

  it('is idempotent when the workspace has no files left', async () => {
    const workspaceId = testbed.ids.generate();

    await expect(cleanUp.execute(systemCtx(), { workspaceId })).resolves.toBeUndefined();
  });

  it('refuses a non-system actor', async () => {
    const workspaceId = testbed.ids.generate();

    await expect(
      cleanUp.execute(userCtx(testbed.ids.generate()), { workspaceId }),
    ).rejects.toBeInstanceOf(SystemActorRequiredError);
  });
});
