import { ErrorCode, ErrorReason, Locale, WorkspaceRole } from '@agent-ic/contracts';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Response } from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AuthRoute } from '@/modules/identity/constants/auth-http.constants';
import { FakeEmailGateway } from '@/modules/notifications/gateways/email.fake';
import { ConnectionParam } from '@/platform/graphql-server/constants/connection-param.constants';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { QueuesService } from '@/platform/queues/services/queues.service';
import { FORWARDED_FOR_HEADER } from '@test/support/constants/auth-flow.constants';
import {
  TEST_PASSWORD,
  TEST_USER_NAME,
  WAIT_FOR_EMAIL,
} from '@test/support/constants/identity-testing.constants';
import { EPHEMERAL_PORT, LOOPBACK_HOST } from '@test/support/constants/request-layer.constants';
import { TestRedisDatabase } from '@test/support/constants/test-infrastructure.constants';
import {
  TEST_TIME_ZONE,
  TEST_WORKSPACE_NAME,
} from '@test/support/constants/workspace-testing.constants';
import {
  CREATE_WORKSPACE_MUTATION,
  INVITE_INFO_QUERY,
  INVITE_LINK_QUERY,
  ME_MEMBERSHIPS_QUERY,
  MEMBERS_QUERY,
  RESET_INVITE_LINK_MUTATION,
  SIGN_UP_WITH_INVITE_MUTATION,
} from '@test/support/constants/workspaces-flow.constants';
import { randomIpAddress, uniqueEmail } from '@test/support/fixtures/identity.fixture';
import { bootRoleWithEmails, confirmationTokenIn } from '@test/support/helpers/auth-flow.helpers';
import {
  apiPath,
  graphqlPath,
  queryOverWebSocket,
} from '@test/support/helpers/request-layer.helpers';
import { inviteTokenIn } from '@test/support/helpers/workspace-testing.helpers';

interface GraphqlCall {
  readonly query: string;
  readonly variables?: Record<string, unknown>;
  readonly accessToken?: string;
  readonly workspaceId?: string;
}

describe('workspaces, roles and invites through the api', () => {
  const emails = new FakeEmailGateway();
  let api: INestApplication;
  let worker: INestApplication;

  const graphql = (call: GraphqlCall): Promise<Response> => {
    let pending = request(api.getHttpServer())
      .post(graphqlPath())
      .set(FORWARDED_FOR_HEADER, randomIpAddress());
    if (call.accessToken !== undefined) {
      pending = pending.set(HttpHeader.Authorization, `Bearer ${call.accessToken}`);
    }
    if (call.workspaceId !== undefined) {
      pending = pending.set(HttpHeader.WorkspaceId, call.workspaceId);
    }
    return pending.send({ query: call.query, variables: call.variables ?? {} });
  };

  const signedInAccount = async (inviteToken: string | null = null): Promise<string> => {
    const email = uniqueEmail();
    await graphql({
      query: SIGN_UP_WITH_INVITE_MUTATION,
      variables: {
        input: {
          name: TEST_USER_NAME,
          email,
          password: TEST_PASSWORD,
          locale: Locale.En,
          inviteToken,
        },
      },
    });
    await vi.waitFor(() => expect(emails.sentTo(email)).toHaveLength(1), WAIT_FOR_EMAIL);
    const confirmed = await request(api.getHttpServer())
      .post(apiPath(AuthRoute.Base, AuthRoute.ConfirmEmail))
      .send({ token: confirmationTokenIn(emails.sentTo(email)[0]?.text ?? '') });
    return confirmed.body.accessToken;
  };

  const errorOf = (response: Response): unknown => response.body.errors?.[0]?.extensions;

  beforeAll(async () => {
    api = await bootRoleWithEmails(
      { role: Role.Api, queues: [] },
      emails,
      TestRedisDatabase.WorkspacesFlow,
    );
    worker = await bootRoleWithEmails(
      { role: Role.Worker, queues: [QueueName.Notify] },
      emails,
      TestRedisDatabase.WorkspacesFlow,
    );
    await api.listen(EPHEMERAL_PORT, LOOPBACK_HOST);
  });

  afterAll(async () => {
    await worker.get(QueuesService).get(QueueName.Notify).obliterate({ force: true });
    await worker.close();
    await api.close();
  });

  it('creates a workspace, invites an operator through sign-up and enforces roles', async () => {
    const ownerToken = await signedInAccount();
    const created = await graphql({
      query: CREATE_WORKSPACE_MUTATION,
      variables: { input: { name: TEST_WORKSPACE_NAME, timeZone: TEST_TIME_ZONE } },
      accessToken: ownerToken,
    });
    const workspaceId: string = created.body.data.createWorkspace.workspace.id;
    expect(created.body.data.createWorkspace.role).toBe(WorkspaceRole.Owner);

    const link = await graphql({ query: INVITE_LINK_QUERY, accessToken: ownerToken, workspaceId });
    const inviteToken = inviteTokenIn(link.body.data.inviteLink.url);
    const operatorToken = await signedInAccount(inviteToken);

    const operatorMe = await graphql({ query: ME_MEMBERSHIPS_QUERY, accessToken: operatorToken });
    expect(operatorMe.body.data.me.memberships).toEqual([
      { workspace: { id: workspaceId }, role: WorkspaceRole.Operator },
    ]);

    const members = await graphql({ query: MEMBERS_QUERY, accessToken: ownerToken, workspaceId });
    expect(members.body.data.members.totalCount).toBe(2);

    const operatorReset = await graphql({
      query: RESET_INVITE_LINK_MUTATION,
      accessToken: operatorToken,
      workspaceId,
    });
    expect(errorOf(operatorReset)).toMatchObject({
      code: ErrorCode.Forbidden,
      reason: ErrorReason.PermissionDenied,
    });

    const strangerToken = await signedInAccount();
    const strangerMembers = await graphql({
      query: MEMBERS_QUERY,
      accessToken: strangerToken,
      workspaceId,
    });
    expect(errorOf(strangerMembers)).toMatchObject({
      code: ErrorCode.Forbidden,
      reason: ErrorReason.WorkspaceAccessDenied,
    });
  });

  it('reads the workspace from connection_init over WebSocket', async () => {
    const ownerToken = await signedInAccount();
    const created = await graphql({
      query: CREATE_WORKSPACE_MUTATION,
      variables: { input: { name: TEST_WORKSPACE_NAME, timeZone: TEST_TIME_ZONE } },
      accessToken: ownerToken,
    });

    const result = await queryOverWebSocket(api, MEMBERS_QUERY, {
      [ConnectionParam.Authorization]: `Bearer ${ownerToken}`,
      [ConnectionParam.WorkspaceId]: created.body.data.createWorkspace.workspace.id,
    });

    expect(result.data?.['members']).toMatchObject({ totalCount: 1 });
  });

  it('turns away the old invite after a reset', async () => {
    const ownerToken = await signedInAccount();
    const created = await graphql({
      query: CREATE_WORKSPACE_MUTATION,
      variables: { input: { name: TEST_WORKSPACE_NAME, timeZone: TEST_TIME_ZONE } },
      accessToken: ownerToken,
    });
    const workspaceId: string = created.body.data.createWorkspace.workspace.id;
    const link = await graphql({ query: INVITE_LINK_QUERY, accessToken: ownerToken, workspaceId });
    const oldToken = inviteTokenIn(link.body.data.inviteLink.url);

    const before = await graphql({ query: INVITE_INFO_QUERY, variables: { token: oldToken } });
    await graphql({ query: RESET_INVITE_LINK_MUTATION, accessToken: ownerToken, workspaceId });
    const after = await graphql({ query: INVITE_INFO_QUERY, variables: { token: oldToken } });

    expect(before.body.data.inviteInfo).toEqual({
      workspaceName: TEST_WORKSPACE_NAME,
      memberCount: 1,
      role: WorkspaceRole.Operator,
    });
    expect(errorOf(after)).toMatchObject({ reason: ErrorReason.InviteInvalid });
  });
});
