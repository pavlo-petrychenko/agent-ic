import { randomUUID } from 'node:crypto';
import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { ConfigService } from '@/platform/config/services/config.service';
import { ActorKind, SystemReason } from '@/platform/context/constants/actor.constants';
import { AccessTokenAuthenticatorService } from '@/platform/context/services/access-token-authenticator.service';
import { AccessTokenService } from '@/platform/context/services/access-token.service';
import { UseCaseCtxService } from '@/platform/context/services/use-case-ctx.service';
import { WorkspaceAccessService } from '@/platform/context/services/workspace-access.service';
import type { TransportRequest } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { InvalidIdError } from '@/platform/ids/errors/invalid-id.error';
import { IdService } from '@/platform/ids/services/id.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { createTestEnv } from '@test/support/fixtures/test-env.fixture';

const START = new Date('2026-10-04T12:00:00.000Z');
const TRACE_ID = 'ctx-trace';

class SingleMembershipAccessService extends WorkspaceAccessService {
  constructor(
    private readonly userId: string,
    private readonly workspaceId: string,
    private readonly role: WorkspaceRole,
  ) {
    super();
  }

  resolveRole(userId: string, workspaceId: string): Promise<WorkspaceRole | null> {
    const isMember = userId === this.userId && workspaceId === this.workspaceId;
    return Promise.resolve(isMember ? this.role : null);
  }
}

const clock = new ManualClock(START);
const ids = new IdService(clock);
const accessTokens = new AccessTokenService(
  new ConfigService(loadAppConfig({ role: Role.Api, queues: [] }, createTestEnv())),
  clock,
  ids,
);

const contextsWith = (access?: WorkspaceAccessService): UseCaseCtxService =>
  new UseCaseCtxService(new AccessTokenAuthenticatorService(accessTokens), ids, access);

const requestOf = (authorization: string | null, workspaceId: string | null): TransportRequest => ({
  authorization,
  acceptLanguage: null,
  workspaceId,
  traceId: TRACE_ID,
  clientIp: null,
});

const bearerFor = async (userId: string): Promise<string> => {
  const { token } = await accessTokens.issue({ userId, sessionId: randomUUID() });
  return `Bearer ${token}`;
};

describe('UseCaseCtxService workspace resolution', () => {
  const userId = randomUUID();
  const workspaceId = randomUUID();
  const publicWorkspaceId = ids.toPublic(IdPrefix.Workspace, workspaceId);
  const memberAccess = new SingleMembershipAccessService(
    userId,
    workspaceId,
    WorkspaceRole.Operator,
  );

  it('sets the workspace and the role for a member', async () => {
    const ctx = await contextsWith(memberAccess).create(
      requestOf(await bearerFor(userId), publicWorkspaceId),
    );

    expect(ctx.workspaceId).toBe(workspaceId);
    expect(ctx.workspaceRole).toBe(WorkspaceRole.Operator);
  });

  it('leaves the workspace empty for a user who is not a member', async () => {
    const ctx = await contextsWith(memberAccess).create(
      requestOf(await bearerFor(randomUUID()), publicWorkspaceId),
    );

    expect(ctx.workspaceId).toBeNull();
    expect(ctx.workspaceRole).toBeNull();
  });

  it('leaves the workspace empty when no membership source is bound', async () => {
    const ctx = await contextsWith().create(requestOf(await bearerFor(userId), publicWorkspaceId));

    expect(ctx.workspaceId).toBeNull();
  });

  it('leaves the workspace empty without the header', async () => {
    const ctx = await contextsWith(memberAccess).create(requestOf(await bearerFor(userId), null));

    expect(ctx.workspaceId).toBeNull();
    expect(ctx.workspaceRole).toBeNull();
  });

  it('ignores the header for an anonymous caller', async () => {
    const ctx = await contextsWith(memberAccess).create(requestOf(null, publicWorkspaceId));

    expect(ctx.actor.kind).toBe(ActorKind.Anonymous);
    expect(ctx.workspaceId).toBeNull();
  });

  it('rejects a header that is not a workspace id', async () => {
    const attempt = contextsWith(memberAccess).create(
      requestOf(await bearerFor(userId), ids.toPublic(IdPrefix.User, workspaceId)),
    );

    await expect(attempt).rejects.toBeInstanceOf(InvalidIdError);
  });

  it('gives the system actor a workspace but no role', () => {
    const ctx = contextsWith(memberAccess).system({
      reason: SystemReason.Job,
      workspaceId,
      traceId: TRACE_ID,
      initiatedBy: null,
    });

    expect(ctx.workspaceId).toBe(workspaceId);
    expect(ctx.workspaceRole).toBeNull();
  });
});
