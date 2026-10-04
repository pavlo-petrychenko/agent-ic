import { createHmac, randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { InviteTokenHmac } from '@/modules/identity/constants/workspace.constants';
import { InviteTokensService } from '@/modules/identity/services/invite-tokens.service';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { ConfigService } from '@/platform/config/services/config.service';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { TEST_ENV } from '@test/support/constants/test-env.constants';
import { createTestEnv } from '@test/support/fixtures/test-env.fixture';

const OTHER_SECRET = 'another-invite-secret-0123456789abcdef0123';
const OTHER_ACCESS_SECRET = 'another-access-secret-0123456789abcdef0123';

const createService = (env: NodeJS.ProcessEnv = createTestEnv()): InviteTokensService =>
  new InviteTokensService(
    new ConfigService(loadAppConfig({ role: Role.Api, queues: [] }, env)),
    new SecureTokenService(),
  );

describe('InviteTokensService', () => {
  const linkId = randomUUID();

  it('derives the token as an HMAC of the link id with INVITE_TOKEN_SECRET', () => {
    const derived = createService().derive(linkId);

    const expected = createHmac(InviteTokenHmac.Algorithm, TEST_ENV[EnvVar.InviteTokenSecret])
      .update(linkId)
      .digest(InviteTokenHmac.Encoding);
    expect(derived.token).toBe(expected);
    expect(derived.hash).toBe(new SecureTokenService().hash(expected));
  });

  it('gives the same token again for the same link', () => {
    expect(createService().derive(linkId)).toEqual(createService().derive(linkId));
  });

  it('changes every token when INVITE_TOKEN_SECRET changes', () => {
    const rotated = createService(createTestEnv({ [EnvVar.InviteTokenSecret]: OTHER_SECRET }));

    expect(rotated.derive(linkId).token).not.toBe(createService().derive(linkId).token);
  });

  it('does not depend on the access token secret', () => {
    const rotated = createService(createTestEnv({ [EnvVar.JwtAccessSecret]: OTHER_ACCESS_SECRET }));

    expect(rotated.derive(linkId).token).toBe(createService().derive(linkId).token);
  });
});
