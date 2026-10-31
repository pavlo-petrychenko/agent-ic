import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GoogleOAuthGateway } from '@/modules/knowledge/gateways/google-oauth.gateway';
import { ConnectionsRepository } from '@/modules/knowledge/repositories/connections.repository';
import { CreateGooglePickerSessionUseCase } from '@/modules/knowledge/use-cases/create-google-picker-session.use-case';
import { SecretBoxService } from '@/platform/secrets/services/secret-box.service';
import {
  TEST_GOOGLE_PICKER_API_KEY,
  TEST_GOOGLE_PICKER_APP_ID,
  TEST_GOOGLE_REFRESH_TOKEN,
} from '@test/support/constants/knowledge-testing.constants';
import { FakeGoogleOAuthGateway } from '@test/support/fakes/google-oauth.fake';
import {
  createKnowledgeTestbed,
  knowledgeCtx,
  publicKnowledgeConnectionId,
  seedKnowledgeConnection,
} from '@test/support/helpers/knowledge-testing.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

describe('CreateGooglePickerSessionUseCase', () => {
  let testbed: KnowledgeTestbed;
  let oauth: FakeGoogleOAuthGateway;
  let connections: ConnectionsRepository;
  let secrets: SecretBoxService;
  let session: CreateGooglePickerSessionUseCase;

  beforeAll(async () => {
    oauth = new FakeGoogleOAuthGateway();
    testbed = await createKnowledgeTestbed([{ token: GoogleOAuthGateway, value: oauth }]);
    connections = testbed.module.get(ConnectionsRepository);
    secrets = testbed.module.get(SecretBoxService);
    session = testbed.module.get(CreateGooglePickerSessionUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('creates a Picker session from a connected account', async () => {
    const workspaceId = testbed.ids.generate();
    const connectionId = await seedKnowledgeConnection(testbed, workspaceId);
    await testbed.tenants.run(workspaceId, () =>
      connections.update(workspaceId, connectionId, {
        sealedRefreshToken: secrets.seal(TEST_GOOGLE_REFRESH_TOKEN),
      }),
    );

    const result = await session.execute(
      knowledgeCtx(workspaceId),
      publicKnowledgeConnectionId(testbed, connectionId),
    );

    expect(result).toEqual({
      accessToken: 'test-google-access-token',
      apiKey: TEST_GOOGLE_PICKER_API_KEY,
      appId: TEST_GOOGLE_PICKER_APP_ID,
      expiresAt: new Date(testbed.clock.now().getTime() + 3_600_000),
    });
    expect(oauth.refreshInputs.at(-1)).toBe(TEST_GOOGLE_REFRESH_TOKEN);
  });
});
