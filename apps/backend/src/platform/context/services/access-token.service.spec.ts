import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { ConfigService } from '@/platform/config/services/config.service';
import { ACCESS_TOKEN_TTL_SECONDS } from '@/platform/context/constants/access-token.constants';
import { InvalidAccessTokenError } from '@/platform/context/errors/invalid-access-token.error';
import { AccessTokenService } from '@/platform/context/services/access-token.service';
import { IdService } from '@/platform/ids/services/id.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { createTestEnv } from '@test/support/fixtures/test-env.fixture';

const START = new Date('2026-10-04T12:00:00.000Z');
const OTHER_SECRET = 'another-access-secret-0123456789abcdef0123';

const createService = (
  env: NodeJS.ProcessEnv = createTestEnv(),
): { service: AccessTokenService; clock: ManualClock } => {
  const clock = new ManualClock(START);
  const config = loadAppConfig({ role: Role.Api, queues: [] }, env);
  return {
    service: new AccessTokenService(new ConfigService(config), clock, new IdService(clock)),
    clock,
  };
};

describe('AccessTokenService', () => {
  const claims = { userId: randomUUID(), sessionId: randomUUID() };

  it('issues a token that verifies back to its user and session', async () => {
    const { service } = createService();

    const issued = await service.issue(claims);

    expect(await service.verify(issued.token)).toEqual(claims);
    expect(issued.expiresAt).toEqual(
      new Date(START.getTime() + ACCESS_TOKEN_TTL_SECONDS * MILLISECONDS_PER_SECOND),
    );
  });

  it('carries only public ids, not the internal ones', async () => {
    const { service } = createService();

    const { token } = await service.issue(claims);
    const payload = Buffer.from(token.split('.')[1] ?? '', 'base64url').toString();

    expect(payload).not.toContain(claims.userId);
    expect(payload).toContain('"sub":"usr_');
    expect(payload).toContain('"sid":"ses_');
  });

  it('rejects a token after fifteen minutes', async () => {
    const { service, clock } = createService();
    const { token } = await service.issue(claims);

    clock.advanceBy(ACCESS_TOKEN_TTL_SECONDS * MILLISECONDS_PER_SECOND);

    await expect(service.verify(token)).rejects.toBeInstanceOf(InvalidAccessTokenError);
  });

  it('rejects a token signed with another secret', async () => {
    const { token } = await createService(
      createTestEnv({ [EnvVar.JwtAccessSecret]: OTHER_SECRET }),
    ).service.issue(claims);

    await expect(createService().service.verify(token)).rejects.toBeInstanceOf(
      InvalidAccessTokenError,
    );
  });

  it('rejects something that is not a token', async () => {
    await expect(createService().service.verify('not-a-token')).rejects.toBeInstanceOf(
      InvalidAccessTokenError,
    );
  });
});
