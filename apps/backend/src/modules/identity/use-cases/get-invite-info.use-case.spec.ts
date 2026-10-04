import { DEFAULT_INVITE_ROLE } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { INVITE_LINK_TTL_SECONDS } from '@/modules/identity/constants/workspace.constants';
import { InviteExpiredError } from '@/modules/identity/errors/invite-expired.error';
import { InviteInvalidError } from '@/modules/identity/errors/invite-invalid.error';
import { GetInviteInfoUseCase } from '@/modules/identity/use-cases/get-invite-info.use-case';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { RateLimitedError } from '@/platform/rate-limit/errors/rate-limited.error';
import {
  MILLISECONDS_PAST_EXPIRY,
  TEST_USER_NAME,
} from '@test/support/constants/identity-testing.constants';
import {
  INVITE_LOOKUPS_PER_HOUR,
  TEST_WORKSPACE_NAME,
} from '@test/support/constants/workspace-testing.constants';
import { anonymousCtx, uniqueIp } from '@test/support/fixtures/identity.fixture';
import { createIdentityTestbed } from '@test/support/helpers/identity-testing.helpers';
import {
  addMember,
  createOwnedWorkspace,
  inviteTokenOf,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('GetInviteInfoUseCase', () => {
  let testbed: IdentityTestbed;
  let getInviteInfo: GetInviteInfoUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    getInviteInfo = testbed.module.get(GetInviteInfoUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('describes the workspace to someone who is not signed in', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    await addMember(testbed, workspace);
    const token = await inviteTokenOf(testbed, workspace);

    const info = await getInviteInfo.execute(anonymousCtx(), { token });

    expect(info).toMatchObject({
      workspaceName: TEST_WORKSPACE_NAME,
      inviterName: TEST_USER_NAME,
      memberCount: 2,
      role: DEFAULT_INVITE_ROLE,
    });
  });

  it('rejects a token it never issued', async () => {
    const attempt = getInviteInfo.execute(anonymousCtx(), { token: 'never-issued' });

    await expect(attempt).rejects.toBeInstanceOf(InviteInvalidError);
  });

  it('rejects an expired link', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const token = await inviteTokenOf(testbed, workspace);

    testbed.clock.advanceBy(
      INVITE_LINK_TTL_SECONDS * MILLISECONDS_PER_SECOND + MILLISECONDS_PAST_EXPIRY,
    );
    const attempt = getInviteInfo.execute(anonymousCtx(), { token });

    await expect(attempt).rejects.toBeInstanceOf(InviteExpiredError);
  });

  it('limits lookups per client address', async () => {
    const clientIp = uniqueIp();
    for (let attempt = 0; attempt < INVITE_LOOKUPS_PER_HOUR; attempt += 1) {
      await expect(
        getInviteInfo.execute(anonymousCtx(clientIp), { token: 'guess' }),
      ).rejects.toBeInstanceOf(InviteInvalidError);
    }

    const blocked = getInviteInfo.execute(anonymousCtx(clientIp), { token: 'guess' });

    await expect(blocked).rejects.toBeInstanceOf(RateLimitedError);
  });
});
