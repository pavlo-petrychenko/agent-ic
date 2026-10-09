import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { UpdateTimeZoneUseCase } from '@/modules/identity/use-cases/update-time-zone.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createIdentityTestbed } from '@test/support/helpers/identity-testing.helpers';
import {
  addMember,
  createOwnedWorkspace,
  ownerCtx,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('UpdateTimeZoneUseCase', () => {
  let testbed: IdentityTestbed;
  let updateTimeZone: UpdateTimeZoneUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    updateTimeZone = testbed.module.get(UpdateTimeZoneUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('changes the time zone for its owner', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const result = await updateTimeZone.execute(ownerCtx(workspace), { timeZone: 'Asia/Tokyo' });

    expect(result.workspace.timeZone).toBe('Asia/Tokyo');
  });

  it('refuses a builder', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const builderId = await addMember(testbed, workspace);

    const attempt = updateTimeZone.execute(
      workspaceCtx(builderId, workspace.workspaceId, WorkspaceRole.Builder),
      { timeZone: 'Asia/Tokyo' },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
