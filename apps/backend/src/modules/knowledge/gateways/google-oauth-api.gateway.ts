import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import {
  GOOGLE_OAUTH_AUTHORIZATION_ENDPOINT,
  GOOGLE_OAUTH_ACCESS_TYPE_OFFLINE,
  GOOGLE_OAUTH_CODE_CHALLENGE_METHOD,
  GOOGLE_OAUTH_FORM_CONTENT_TYPE,
  GOOGLE_OAUTH_GRANT_TYPE_AUTHORIZATION_CODE,
  GOOGLE_OAUTH_GRANT_TYPE_REFRESH_TOKEN,
  GOOGLE_OAUTH_INCLUDE_GRANTED_SCOPES,
  GOOGLE_OAUTH_JSON_CONTENT_TYPE,
  GOOGLE_OAUTH_PROMPT_CONSENT,
  GOOGLE_OAUTH_RESPONSE_TYPE_CODE,
  GOOGLE_OAUTH_SCOPE_SEPARATOR,
  GOOGLE_OAUTH_SCOPES,
  GOOGLE_OAUTH_TIMEOUT_MS,
  GOOGLE_OAUTH_TOKEN_ENDPOINT,
  GOOGLE_OAUTH_USERINFO_ENDPOINT,
  GoogleOAuthParam,
} from '@/modules/knowledge/constants/google-oauth.constants';
import { GoogleOAuthGateway } from '@/modules/knowledge/gateways/google-oauth.gateway';
import { googleHttpRequest, googleJson } from '@/modules/knowledge/helpers/google-http.helpers';
import { requireGoogleConfig } from '@/modules/knowledge/helpers/google-oauth.helpers';
import type {
  GoogleAccessToken,
  GoogleAccount,
  GoogleAuthorizationUrlInput,
  GoogleCodeExchangeInput,
  GoogleTokenSet,
} from '@/modules/knowledge/typedefs/google-oauth.typedefs';
import { ConfigService } from '@/platform/config/services/config.service';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';
import { OutboundHttpGateway } from '@/platform/outbound-http/gateways/outbound-http.gateway';

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1).optional(),
  expires_in: z.number().int().positive(),
  scope: z.string().min(1),
});

const refreshResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
});

const userInfoSchema = z.object({
  sub: z.string().min(1),
  email: z.email(),
});

@Injectable()
export class GoogleOAuthApiGateway extends GoogleOAuthGateway {
  constructor(
    private readonly config: ConfigService,
    private readonly http: OutboundHttpGateway,
  ) {
    super();
  }

  authorizationUrl(input: GoogleAuthorizationUrlInput): string {
    const google = requireGoogleConfig(this.config.config.google);
    const parameters = new URLSearchParams({
      [GoogleOAuthParam.ClientId]: google.clientId,
      [GoogleOAuthParam.RedirectUri]: google.redirectUri,
      [GoogleOAuthParam.ResponseType]: GOOGLE_OAUTH_RESPONSE_TYPE_CODE,
      [GoogleOAuthParam.Scope]: GOOGLE_OAUTH_SCOPES.join(GOOGLE_OAUTH_SCOPE_SEPARATOR),
      [GoogleOAuthParam.State]: input.state,
      [GoogleOAuthParam.CodeChallenge]: input.codeChallenge,
      [GoogleOAuthParam.CodeChallengeMethod]: GOOGLE_OAUTH_CODE_CHALLENGE_METHOD,
      [GoogleOAuthParam.AccessType]: GOOGLE_OAUTH_ACCESS_TYPE_OFFLINE,
      [GoogleOAuthParam.Prompt]: GOOGLE_OAUTH_PROMPT_CONSENT,
      [GoogleOAuthParam.IncludeGrantedScopes]: GOOGLE_OAUTH_INCLUDE_GRANTED_SCOPES,
    });
    return `${GOOGLE_OAUTH_AUTHORIZATION_ENDPOINT}?${parameters.toString()}`;
  }

  async exchangeCode(input: GoogleCodeExchangeInput): Promise<GoogleTokenSet> {
    const google = requireGoogleConfig(this.config.config.google);
    const body = new URLSearchParams({
      [GoogleOAuthParam.ClientId]: google.clientId,
      [GoogleOAuthParam.ClientSecret]: google.clientSecret,
      [GoogleOAuthParam.RedirectUri]: google.redirectUri,
      [GoogleOAuthParam.Code]: input.code,
      [GoogleOAuthParam.CodeVerifier]: input.codeVerifier,
      [GoogleOAuthParam.GrantType]: GOOGLE_OAUTH_GRANT_TYPE_AUTHORIZATION_CODE,
    });
    const result = await googleHttpRequest(this.http, {
      method: 'POST',
      url: GOOGLE_OAUTH_TOKEN_ENDPOINT,
      headers: {
        [HttpHeader.ContentType]: GOOGLE_OAUTH_FORM_CONTENT_TYPE,
        [HttpHeader.Accept]: GOOGLE_OAUTH_JSON_CONTENT_TYPE,
      },
      body: body.toString(),
      timeoutMs: GOOGLE_OAUTH_TIMEOUT_MS,
    });
    const parsed = googleJson(result, tokenResponseSchema);
    return {
      accessToken: parsed.access_token,
      refreshToken: parsed.refresh_token ?? null,
      scopes: parsed.scope.split(GOOGLE_OAUTH_SCOPE_SEPARATOR),
      expiresInSeconds: parsed.expires_in,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<GoogleAccessToken> {
    const google = requireGoogleConfig(this.config.config.google);
    const body = new URLSearchParams({
      [GoogleOAuthParam.ClientId]: google.clientId,
      [GoogleOAuthParam.ClientSecret]: google.clientSecret,
      [GoogleOAuthParam.RefreshToken]: refreshToken,
      [GoogleOAuthParam.GrantType]: GOOGLE_OAUTH_GRANT_TYPE_REFRESH_TOKEN,
    });
    const result = await googleHttpRequest(this.http, {
      method: 'POST',
      url: GOOGLE_OAUTH_TOKEN_ENDPOINT,
      headers: {
        [HttpHeader.ContentType]: GOOGLE_OAUTH_FORM_CONTENT_TYPE,
        [HttpHeader.Accept]: GOOGLE_OAUTH_JSON_CONTENT_TYPE,
      },
      body: body.toString(),
      timeoutMs: GOOGLE_OAUTH_TIMEOUT_MS,
    });
    const parsed = googleJson(result, refreshResponseSchema);
    return {
      accessToken: parsed.access_token,
      expiresInSeconds: parsed.expires_in,
    };
  }

  async userInfo(accessToken: string): Promise<GoogleAccount> {
    const result = await googleHttpRequest(this.http, {
      method: 'GET',
      url: GOOGLE_OAUTH_USERINFO_ENDPOINT,
      headers: {
        [HttpHeader.Authorization]: `Bearer ${accessToken}`,
        [HttpHeader.Accept]: GOOGLE_OAUTH_JSON_CONTENT_TYPE,
      },
      body: null,
      timeoutMs: GOOGLE_OAUTH_TIMEOUT_MS,
    });
    const parsed = googleJson(result, userInfoSchema);
    return { subject: parsed.sub, email: parsed.email };
  }
}
