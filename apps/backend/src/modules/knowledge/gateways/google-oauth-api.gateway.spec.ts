import { HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  GOOGLE_OAUTH_AUTHORIZATION_ENDPOINT,
  GOOGLE_OAUTH_CODE_CHALLENGE_METHOD,
  GOOGLE_OAUTH_FORM_CONTENT_TYPE,
  GOOGLE_OAUTH_PROMPT_CONSENT,
  GOOGLE_OAUTH_SCOPES,
  GOOGLE_OAUTH_TOKEN_ENDPOINT,
  GOOGLE_OAUTH_USERINFO_ENDPOINT,
  GoogleOAuthParam,
} from '@/modules/knowledge/constants/google-oauth.constants';
import { GoogleOAuthFailedError } from '@/modules/knowledge/errors/google-oauth-failed.error';
import { GoogleOAuthNotConfiguredError } from '@/modules/knowledge/errors/google-oauth-not-configured.error';
import { GoogleOAuthApiGateway } from '@/modules/knowledge/gateways/google-oauth-api.gateway';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { ConfigService } from '@/platform/config/services/config.service';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { OutboundHttpOutcome } from '@/platform/outbound-http/constants/outbound-http.constants';
import { FakeOutboundHttpGateway } from '@/platform/outbound-http/gateways/outbound-http.fake';
import {
  TEST_CONNECTION_EMAIL,
  TEST_CONNECTION_SUBJECT,
  TEST_GOOGLE_ACCESS_TOKEN,
  TEST_GOOGLE_REFRESH_TOKEN,
  TEST_GOOGLE_SCOPE,
} from '@test/support/constants/knowledge-testing.constants';
import { createTestEnv } from '@test/support/fixtures/test-env.fixture';

const configOf = (env = createTestEnv()): ConfigService =>
  new ConfigService(loadAppConfig({ role: Role.Api, queues: [] }, env));

const gatewayOf = (http: FakeOutboundHttpGateway, env = createTestEnv()): GoogleOAuthApiGateway =>
  new GoogleOAuthApiGateway(configOf(env), http);

const tokenResponse = JSON.stringify({
  access_token: TEST_GOOGLE_ACCESS_TOKEN,
  refresh_token: TEST_GOOGLE_REFRESH_TOKEN,
  expires_in: 3600,
  scope: TEST_GOOGLE_SCOPE,
});

describe('GoogleOAuthApiGateway', () => {
  it('builds the authorization url with PKCE and offline access', () => {
    const gateway = gatewayOf(new FakeOutboundHttpGateway());

    const url = new URL(
      gateway.authorizationUrl({ state: 'state-value', codeChallenge: 'challenge-value' }),
    );

    expect(`${url.origin}${url.pathname}`).toBe(GOOGLE_OAUTH_AUTHORIZATION_ENDPOINT);
    expect(url.searchParams.get(GoogleOAuthParam.ClientId)).toBe('test-google-client-id');
    expect(url.searchParams.get(GoogleOAuthParam.RedirectUri)).toBe(
      'https://app.agent-ic.test/oauth/google/callback',
    );
    expect(url.searchParams.get(GoogleOAuthParam.Scope)).toBe(GOOGLE_OAUTH_SCOPES.join(' '));
    expect(url.searchParams.get(GoogleOAuthParam.State)).toBe('state-value');
    expect(url.searchParams.get(GoogleOAuthParam.CodeChallenge)).toBe('challenge-value');
    expect(url.searchParams.get(GoogleOAuthParam.CodeChallengeMethod)).toBe(
      GOOGLE_OAUTH_CODE_CHALLENGE_METHOD,
    );
    expect(url.searchParams.get(GoogleOAuthParam.Prompt)).toBe(GOOGLE_OAUTH_PROMPT_CONSENT);
    expect(url.searchParams.get(GoogleOAuthParam.AccessType)).toBe('offline');
  });

  it('exchanges the code with the client secret and the verifier', async () => {
    const http = new FakeOutboundHttpGateway().respond(HttpStatus.OK, tokenResponse);
    const gateway = gatewayOf(http);

    const tokens = await gateway.exchangeCode({ code: 'code-value', codeVerifier: 'verifier' });

    expect(tokens).toEqual({
      accessToken: TEST_GOOGLE_ACCESS_TOKEN,
      refreshToken: TEST_GOOGLE_REFRESH_TOKEN,
      scopes: TEST_GOOGLE_SCOPE.split(' '),
      expiresInSeconds: 3600,
    });
    const request = http.requests[0];
    if (request === undefined) {
      throw new Error('the gateway did not send a request');
    }
    expect(request.method).toBe('POST');
    expect(request.url).toBe(GOOGLE_OAUTH_TOKEN_ENDPOINT);
    expect(request.headers[HttpHeader.ContentType]).toBe(GOOGLE_OAUTH_FORM_CONTENT_TYPE);
    const body = new URLSearchParams(request.body ?? '');
    expect(body.get(GoogleOAuthParam.Code)).toBe('code-value');
    expect(body.get(GoogleOAuthParam.CodeVerifier)).toBe('verifier');
    expect(body.get(GoogleOAuthParam.ClientSecret)).toBe('test-google-client-secret');
    expect(body.get(GoogleOAuthParam.GrantType)).toBe('authorization_code');
  });

  it('reads the account identity with the access token', async () => {
    const http = new FakeOutboundHttpGateway().respond(
      HttpStatus.OK,
      JSON.stringify({ sub: TEST_CONNECTION_SUBJECT, email: TEST_CONNECTION_EMAIL }),
    );
    const gateway = gatewayOf(http);

    await expect(gateway.userInfo(TEST_GOOGLE_ACCESS_TOKEN)).resolves.toEqual({
      subject: TEST_CONNECTION_SUBJECT,
      email: TEST_CONNECTION_EMAIL,
    });
    const request = http.requests[0];
    if (request === undefined) {
      throw new Error('the gateway did not send a request');
    }
    expect(request.url).toBe(GOOGLE_OAUTH_USERINFO_ENDPOINT);
    expect(request.headers[HttpHeader.Authorization]).toBe(`Bearer ${TEST_GOOGLE_ACCESS_TOKEN}`);
  });

  it('fails when Google answers with an error status', async () => {
    const http = new FakeOutboundHttpGateway().respond(HttpStatus.BAD_REQUEST, '{}');
    const gateway = gatewayOf(http);

    await expect(
      gateway.exchangeCode({ code: 'code-value', codeVerifier: 'verifier' }),
    ).rejects.toBeInstanceOf(GoogleOAuthFailedError);
  });

  it('fails when Google cannot be reached', async () => {
    const http = new FakeOutboundHttpGateway().failWith(OutboundHttpOutcome.Unreachable);
    const gateway = gatewayOf(http);

    await expect(
      gateway.exchangeCode({ code: 'code-value', codeVerifier: 'verifier' }),
    ).rejects.toMatchObject({ reason: 'GOOGLE_OAUTH_FAILED' });
  });

  it('rejects a token response without a refresh token field', async () => {
    const http = new FakeOutboundHttpGateway().respond(
      HttpStatus.OK,
      JSON.stringify({
        access_token: TEST_GOOGLE_ACCESS_TOKEN,
        expires_in: 3600,
        scope: TEST_GOOGLE_SCOPE,
      }),
    );
    const gateway = gatewayOf(http);

    const tokens = await gateway.exchangeCode({ code: 'code-value', codeVerifier: 'verifier' });

    expect(tokens.refreshToken).toBeNull();
  });

  it('refuses to start without Google configuration', () => {
    const env = createTestEnv({
      [EnvVar.GoogleClientId]: undefined,
      [EnvVar.GoogleClientSecret]: undefined,
      [EnvVar.GoogleOAuthRedirectUri]: undefined,
    });
    const gateway = gatewayOf(new FakeOutboundHttpGateway(), env);

    expect(() => gateway.authorizationUrl({ state: 'state', codeChallenge: 'challenge' })).toThrow(
      GoogleOAuthNotConfiguredError,
    );
  });
});
