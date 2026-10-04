import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { asc, eq } from 'drizzle-orm';
import { inviteLinks } from '@/modules/identity/db/invite-links.table';
import { memberships } from '@/modules/identity/db/memberships.table';
import type { InviteLinkRecord } from '@/modules/identity/typedefs/invite-link.typedefs';
import type { MembershipRecord } from '@/modules/identity/typedefs/membership.typedefs';
import type {
  CreateWorkspaceInput,
  WorkspaceMembership,
} from '@/modules/identity/typedefs/workspace.typedefs';
import { AcceptInviteUseCase } from '@/modules/identity/use-cases/accept-invite.use-case';
import { CreateWorkspaceUseCase } from '@/modules/identity/use-cases/create-workspace.use-case';
import { GetInviteLinkUseCase } from '@/modules/identity/use-cases/get-invite-link.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';
import { IdService } from '@/platform/ids/services/id.service';
import { INVITE_URL_PATTERN } from '@test/support/constants/workspace-testing.constants';
import { MissingTestDataError } from '@test/support/errors/missing-test-data.error';
import { userCtx } from '@test/support/fixtures/identity.fixture';
import { createWorkspaceInput, workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createConfirmedAccount } from '@test/support/helpers/identity-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';
import type { TestWorkspace } from '@test/support/typedefs/workspace-testing.typedefs';

export const createWorkspaceFor = async (
  testbed: IdentityTestbed,
  ownerId: string,
  overrides: Partial<CreateWorkspaceInput> = {},
): Promise<TestWorkspace> => {
  const created = await testbed.module
    .get(CreateWorkspaceUseCase)
    .execute(userCtx(ownerId), createWorkspaceInput(overrides));
  const publicId = created.workspace.id;
  return {
    workspaceId: testbed.module.get(IdService).fromPublic(IdPrefix.Workspace, publicId),
    publicId,
    ownerId,
  };
};

export const createOwnedWorkspace = async (testbed: IdentityTestbed): Promise<TestWorkspace> => {
  const owner = await createConfirmedAccount(testbed);
  return createWorkspaceFor(testbed, owner.userId);
};

export const ownerCtx = (workspace: TestWorkspace): UseCaseCtx =>
  workspaceCtx(workspace.ownerId, workspace.workspaceId, WorkspaceRole.Owner);

export const inviteTokenIn = (url: string): string => {
  const token = INVITE_URL_PATTERN.exec(url)?.[1];
  if (token === undefined) {
    throw new MissingTestDataError(url);
  }
  return token;
};

export const inviteTokenOf = async (
  testbed: IdentityTestbed,
  workspace: TestWorkspace,
): Promise<string> => {
  const link = await testbed.module.get(GetInviteLinkUseCase).execute(ownerCtx(workspace));
  if (link === null) {
    throw new MissingTestDataError(workspace.publicId);
  }
  return inviteTokenIn(link.url);
};

export const joinWorkspace = (
  testbed: IdentityTestbed,
  userId: string,
  token: string,
): Promise<WorkspaceMembership> =>
  testbed.module.get(AcceptInviteUseCase).execute(userCtx(userId), { token });

export const addMember = async (
  testbed: IdentityTestbed,
  workspace: TestWorkspace,
): Promise<string> => {
  const member = await createConfirmedAccount(testbed);
  await joinWorkspace(testbed, member.userId, await inviteTokenOf(testbed, workspace));
  return member.userId;
};

export const readMemberships = (
  testbed: IdentityTestbed,
  workspaceId: string,
): Promise<MembershipRecord[]> =>
  testbed.module
    .get(SystemDatabaseService)
    .db.select()
    .from(memberships)
    .where(eq(memberships.workspaceId, workspaceId))
    .orderBy(asc(memberships.createdAt), asc(memberships.id));

export const activeInviteLinkOf = async (
  testbed: IdentityTestbed,
  workspaceId: string,
): Promise<InviteLinkRecord> => {
  const links = await readInviteLinks(testbed, workspaceId);
  const active = links.find((link) => link.revokedAt === null);
  if (active === undefined) {
    throw new MissingTestDataError(workspaceId);
  }
  return active;
};

export const readInviteLinks = (
  testbed: IdentityTestbed,
  workspaceId: string,
): Promise<InviteLinkRecord[]> =>
  testbed.module
    .get(SystemDatabaseService)
    .db.select()
    .from(inviteLinks)
    .where(eq(inviteLinks.workspaceId, workspaceId))
    .orderBy(asc(inviteLinks.createdAt), asc(inviteLinks.id));
