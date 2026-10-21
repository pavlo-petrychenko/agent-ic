import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { runMigrations } from '@/platform/database/helpers/migration.helpers';
import {
  LAST_TAG_BEFORE_FOREIGN_KEYS,
  ORPHANS_DATABASE,
} from '@test/support/constants/migration-testing.constants';
import { TEST_INFRASTRUCTURE_KEY } from '@test/support/constants/test-infrastructure.constants';
import { openScratchDatabase } from '@test/support/helpers/database-testing.helpers';
import {
  createOwnedDatabase,
  databaseUrlFor,
  dropDatabase,
  migrateThrough,
} from '@test/support/helpers/migration-testing.helpers';
import { readOrphanSurvivors, seedOrphans } from '@test/support/helpers/orphans-testing.helpers';
import { discardNotice } from '@test/support/helpers/test-infrastructure.helpers';
import type { ScratchDatabase } from '@test/support/typedefs/test-infrastructure.typedefs';

describe('the foreign keys migration', () => {
  const infrastructure = inject(TEST_INFRASTRUCTURE_KEY);
  const ownerUrl = databaseUrlFor(infrastructure.ownerUrl, ORPHANS_DATABASE);
  let superuser: ScratchDatabase;

  beforeAll(async () => {
    await createOwnedDatabase(infrastructure.superuserUrl, ORPHANS_DATABASE);
    await migrateThrough(ownerUrl, LAST_TAG_BEFORE_FOREIGN_KEYS);
    superuser = openScratchDatabase(databaseUrlFor(infrastructure.superuserUrl, ORPHANS_DATABASE));
  });

  afterAll(async () => {
    await superuser.close();
    await dropDatabase(infrastructure.superuserUrl, ORPHANS_DATABASE);
  });

  it('cleans orphan rows so the keys apply to a database that was not recreated', async () => {
    const seeded = await seedOrphans(superuser.db);

    await runMigrations(ownerUrl, discardNotice);

    const survivors = await readOrphanSurvivors(superuser.db, seeded);
    expect(survivors.user).toEqual({ lastWorkspaceId: null, pendingInviteLinkId: null });
    expect(survivors.agents).toEqual([{ id: seeded.keptAgentId, liveVersionId: null }]);
    expect(survivors.conversations).toEqual([
      { id: seeded.keptConversationId, activeRunId: null, handledBy: null },
    ]);
    expect(survivors.left).toEqual({
      versions: [],
      messages: [],
      runs: [],
      folders: [],
      prompts: [],
    });
  });
});
