import { ErrorReason, IdPrefix } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { googleOAuthStateEntry } from '@/modules/knowledge/constants/google-oauth-cache.constants';
import { GOOGLE_OAUTH_STATE_TTL_SECONDS } from '@/modules/knowledge/constants/google-oauth.constants';
import { KnowledgeConnectionStatus } from '@/modules/knowledge/constants/knowledge.constants';
import { GoogleOAuthFailedError } from '@/modules/knowledge/errors/google-oauth-failed.error';
import { GoogleOAuthStateInvalidError } from '@/modules/knowledge/errors/google-oauth-state-invalid.error';
import { GoogleOAuthGateway } from '@/modules/knowledge/gateways/google-oauth.gateway';
import { ConnectionsRepository } from '@/modules/knowledge/repositories/connections.repository';
import { CompleteGoogleConnectionUseCase } from '@/modules/knowledge/use-cases/complete-google-connection.use-case';
import { ListGoogleConnectionsUseCase } from '@/modules/knowledge/use-cases/list-google-connections.use-case';
import { StartGoogleConnectionUseCase } from '@/modules/knowledge/use-cases/start-google-connection.use-case';
import { CacheService } from '@/platform/cache/services/cache.service';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { SecretBoxService } from '@/platform/secrets/services/secret-box.service';
import { TEST_EDITOR_ID } from '@test/support/constants/agents-testing.constants';
import {
  TEST_CONNECTION_EMAIL,
  TEST_CONNECTION_SUBJECT,
  TEST_GOOGLE_ACCESS_TOKEN,
  TEST_GOOGLE_REFRESH_TOKEN,
  TEST_GOOGLE_SCOPE,
} from '@test/support/constants/knowledge-testing.constants';
import { FakeGoogleOAuthGateway } from '@test/support/fakes/google-oauth.fake';
import {
  createKnowledgeTestbed,
  knowledgeCtx,
  publicKnowledgeConnectionId,
  seedKnowledgeConnection,
} from '@test/support/helpers/knowledge-testing.helpers';
import { ensureUserRow, ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

describe('Google connection use cases', () => {
  let testbed: KnowledgeTestbed;
  let gateway: FakeGoogleOAuthGateway;
  let start: StartGoogleConnectionUseCase;
  let complete: CompleteGoogleConnectionUseCase;
  let list: ListGoogleConnectionsUseCase;
  let connections: ConnectionsRepository;
  let cache: CacheService;
  let secrets: SecretBoxService;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    gateway = new FakeGoogleOAuthGateway();
    testbed = await createKnowledgeTestbed([{ token: GoogleOAuthGateway, value: gateway }]);
    start = testbed.module.get(StartGoogleConnectionUseCase);
    complete = testbed.module.get(CompleteGoogleConnectionUseCase);
    list = testbed.module.get(ListGoogleConnectionsUseCase);
    connections = testbed.module.get(ConnectionsRepository);
    cache = testbed.module.get(CacheService);
    secrets = testbed.module.get(SecretBoxService);
    tenants = testbed.module.get(TenantTransactionService);
    ids = testbed.module.get(IdService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const startFlow = async (workspaceId: string) => {
    await ensureWorkspaceRow(testbed.module, workspaceId);
    await ensureUserRow(testbed.module, TEST_EDITOR_ID);
    const ctx = knowledgeCtx(workspaceId);
    const started = await start.execute(ctx);
    const authorization = gateway.authorizationInputs.at(-1);
    if (authorization === undefined) {
      throw new Error('the gateway did not receive the authorization request');
    }
    return { started, authorization };
  };

  it('starts the flow, stores the verifier and completes a connection', async () => {
    const workspaceId = ids.generate();
    const { started, authorization } = await startFlow(workspaceId);

    expect(started.expiresAt).toEqual(
      new Date(
        testbed.clock.now().getTime() + GOOGLE_OAUTH_STATE_TTL_SECONDS * MILLISECONDS_PER_SECOND,
      ),
    );
    expect(started.authorizationUrl).toContain(authorization.state);
    expect(authorization.codeChallenge).not.toBe('');
    expect(await cache.get(googleOAuthStateEntry(authorization.state))).toEqual({
      workspaceId,
      userId: TEST_EDITOR_ID,
      codeVerifier: expect.any(String),
    });

    const view = await complete.execute(knowledgeCtx(workspaceId), {
      state: authorization.state,
      code: 'code-value',
    });

    expect(view).toMatchObject({
      provider: 'google_docs',
      accountEmail: TEST_CONNECTION_EMAIL,
      status: KnowledgeConnectionStatus.Active,
      scopes: TEST_GOOGLE_SCOPE.split(' '),
    });
    expect(await cache.get(googleOAuthStateEntry(authorization.state))).toBeNull();
    expect(gateway.exchangeInputs.at(-1)).toMatchObject({
      code: 'code-value',
      codeVerifier: expect.any(String),
    });
    expect(gateway.accessTokens.at(-1)).toBe(TEST_GOOGLE_ACCESS_TOKEN);
    const connectionId = ids.fromPublic(IdPrefix.KnowledgeConnection, view.id);
    const stored = await tenants.run(workspaceId, () =>
      connections.findById(workspaceId, connectionId),
    );
    if (stored === null) {
      throw new Error('the connection was not stored');
    }
    expect(stored.accountSubject).toBe(TEST_CONNECTION_SUBJECT);
    expect(secrets.open(stored.sealedRefreshToken)).toBe(TEST_GOOGLE_REFRESH_TOKEN);
    expect(await list.execute(knowledgeCtx(workspaceId))).toEqual([view]);
  });

  it('reconnects the same account without creating a second row', async () => {
    const workspaceId = ids.generate();
    const connectionId = await seedKnowledgeConnection(testbed, workspaceId, {
      status: KnowledgeConnectionStatus.Revoked,
      lastErrorCode: 'revoked',
      lastErrorMessage: 'the token was revoked',
    });
    const { authorization } = await startFlow(workspaceId);

    const view = await complete.execute(knowledgeCtx(workspaceId), {
      state: authorization.state,
      code: 'code-value',
    });

    expect(view.id).toBe(publicKnowledgeConnectionId(testbed, connectionId));
    expect(view).toMatchObject({
      status: KnowledgeConnectionStatus.Active,
      lastErrorCode: null,
      lastErrorMessage: null,
    });
    const stored = await tenants.run(workspaceId, () =>
      connections.findById(workspaceId, connectionId),
    );
    expect(stored?.status).toBe(KnowledgeConnectionStatus.Active);
  });

  it('rejects a state that belongs to another workspace', async () => {
    const firstWorkspaceId = ids.generate();
    const secondWorkspaceId = ids.generate();
    const { authorization } = await startFlow(firstWorkspaceId);

    const attempt = complete.execute(knowledgeCtx(secondWorkspaceId), {
      state: authorization.state,
      code: 'code-value',
    });

    await expect(attempt).rejects.toBeInstanceOf(GoogleOAuthStateInvalidError);
    await expect(attempt).rejects.toMatchObject({
      reason: ErrorReason.GoogleOAuthStateInvalid,
    });
  });

  it('consumes the state once', async () => {
    const workspaceId = ids.generate();
    const { authorization } = await startFlow(workspaceId);
    await complete.execute(knowledgeCtx(workspaceId), {
      state: authorization.state,
      code: 'code-value',
    });

    const attempt = complete.execute(knowledgeCtx(workspaceId), {
      state: authorization.state,
      code: 'code-value',
    });

    await expect(attempt).rejects.toBeInstanceOf(GoogleOAuthStateInvalidError);
  });

  it('refuses a connection without a refresh token', async () => {
    const workspaceId = ids.generate();
    gateway.setTokens({ refreshToken: null });
    const { authorization } = await startFlow(workspaceId);

    const attempt = complete.execute(knowledgeCtx(workspaceId), {
      state: authorization.state,
      code: 'code-value',
    });

    await expect(attempt).rejects.toBeInstanceOf(GoogleOAuthFailedError);
    gateway.setTokens({ refreshToken: TEST_GOOGLE_REFRESH_TOKEN });
  });
});
