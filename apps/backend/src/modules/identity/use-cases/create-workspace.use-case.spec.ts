import { DEFAULT_INVITE_ROLE, ErrorReason, IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { INVITE_LINK_TTL_SECONDS } from '@/modules/identity/constants/workspace.constants';
import { InvalidWorkspaceInputError } from '@/modules/identity/errors/invalid-workspace-input.error';
import { CreateWorkspaceUseCase } from '@/modules/identity/use-cases/create-workspace.use-case';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { AuthenticationRequiredError } from '@/platform/context/errors/authentication-required.error';
import { IdService } from '@/platform/ids/services/id.service';
import {
  TEST_TIME_ZONE,
  TEST_WORKSPACE_NAME,
  UNKNOWN_TIME_ZONE,
} from '@test/support/constants/workspace-testing.constants';
import { anonymousCtx, userCtx } from '@test/support/fixtures/identity.fixture';
import { createWorkspaceInput } from '@test/support/fixtures/workspace.fixture';
import {
  createConfirmedAccount,
  createIdentityTestbed,
} from '@test/support/helpers/identity-testing.helpers';
import {
  createWorkspaceFor,
  readInviteLinks,
  readMemberships,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('CreateWorkspaceUseCase', () => {
  let testbed: IdentityTestbed;
  let createWorkspace: CreateWorkspaceUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    createWorkspace = testbed.module.get(CreateWorkspaceUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('makes the creator its owner and opens an operator invite link', async () => {
    const owner = await createConfirmedAccount(testbed);

    const created = await createWorkspace.execute(
      userCtx(owner.userId),
      createWorkspaceInput({ name: `  ${TEST_WORKSPACE_NAME} ` }),
    );

    expect(created).toEqual({
      workspace: {
        id: expect.stringMatching(new RegExp(`^${IdPrefix.Workspace}_`)),
        name: TEST_WORKSPACE_NAME,
        timeZone: TEST_TIME_ZONE,
        memberCount: 1,
      },
      role: WorkspaceRole.Owner,
    });
    const workspaceId = testbed.module
      .get(IdService)
      .fromPublic(IdPrefix.Workspace, created.workspace.id);
    const [membership] = await readMemberships(testbed, workspaceId);
    const [link] = await readInviteLinks(testbed, workspaceId);
    expect(membership).toMatchObject({ userId: owner.userId, role: WorkspaceRole.Owner });
    expect(membership?.inviteLinkId).toBeNull();
    expect(link).toMatchObject({ role: DEFAULT_INVITE_ROLE, revokedAt: null });
    expect(link?.expiresAt).toEqual(
      new Date(testbed.clock.now().getTime() + INVITE_LINK_TTL_SECONDS * MILLISECONDS_PER_SECOND),
    );
  });

  it('lets one user own several workspaces', async () => {
    const owner = await createConfirmedAccount(testbed);

    const first = await createWorkspaceFor(testbed, owner.userId);
    const second = await createWorkspaceFor(testbed, owner.userId);

    expect(first.workspaceId).not.toBe(second.workspaceId);
  });

  it('rejects an empty name and an unknown time zone field by field', async () => {
    const owner = await createConfirmedAccount(testbed);

    const attempt = createWorkspace.execute(
      userCtx(owner.userId),
      createWorkspaceInput({ name: '   ', timeZone: UNKNOWN_TIME_ZONE }),
    );

    await expect(attempt).rejects.toBeInstanceOf(InvalidWorkspaceInputError);
    await expect(attempt).rejects.toMatchObject({
      fields: [
        { path: 'name', reason: ErrorReason.InvalidWorkspaceName },
        { path: 'timeZone', reason: ErrorReason.InvalidTimeZone },
      ],
    });
  });

  it('accepts UTC as a time zone', async () => {
    const owner = await createConfirmedAccount(testbed);

    const created = await createWorkspace.execute(
      userCtx(owner.userId),
      createWorkspaceInput({ timeZone: 'UTC' }),
    );

    expect(created.workspace.timeZone).toBe('UTC');
  });

  it('requires a signed-in user', async () => {
    const attempt = createWorkspace.execute(anonymousCtx(), createWorkspaceInput());

    await expect(attempt).rejects.toBeInstanceOf(AuthenticationRequiredError);
  });
});
