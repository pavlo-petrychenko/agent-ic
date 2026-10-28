import { HttpStatus, Injectable } from '@nestjs/common';
import { z } from 'zod';
import {
  GOOGLE_OAUTH_AUTHORIZATION_ENDPOINT,
  GOOGLE_OAUTH_ACCESS_TYPE_OFFLINE,
  GOOGLE_OAUTH_CODE_CHALLENGE_METHOD,
  GOOGLE_OAUTH_FORM_CONTENT_TYPE,
  GOOGLE_OAUTH_GRANT_TYPE_AUTHORIZATION_CODE,
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
import { GoogleOAuthFailedError } from '@/modules/knowledge/errors/google-oauth-failed.error';
import { GoogleOAuthGateway } from '@/modules/knowledge/gateways/google-oauth.gateway';
import { requireGoogleConfig } from '@/modules/knowledge/helpers/google-oauth.helpers';
import type {
  GoogleAccount,
  GoogleAuthorizationUrlInput,
  GoogleCodeExchangeInput,
  GoogleTokenSet,
} from '@/modules/knowledge/typedefs/google-oauth.typedefs';
import { ConfigService } from '@/platform/config/services/config.service';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';
import { OutboundHttpOutcome } from '@/platform/outbound-http/constants/outbound-http.constants';
import { OutboundHttpGateway } from '@/platform/outbound-http/gateways/outbound-http.gateway';
import type {
  OutboundHttpResult,
  OutboundHttpRequest,
} from '@/platform/outbound-http/typedefs/outbound-http.typedefs';

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1).optional(),
  expires_in: z.number().int().positive(),
  scope: z.string().min(1),
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
    const result = await this.send(GOOGLE_OAUTH_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        [HttpHeader.ContentType]: GOOGLE_OAUTH_FORM_CONTENT_TYPE,
        [HttpHeader.Accept]: GOOGLE_OAUTH_JSON_CONTENT_TYPE,
      },
      body: body.toString(),
    });
    const parsed = tokenResponseSchema.safeParse(this.json(result));
    if (!parsed.success) {
      throw new GoogleOAuthFailedError({ code: 'token_response_invalid' }, parsed.error);
    }
    return {
      accessToken: parsed.data.access_token,
      refreshToken: parsed.data.refresh_token ?? null,
      scopes: parsed.data.scope.split(GOOGLE_OAUTH_SCOPE_SEPARATOR),
      expiresInSeconds: parsed.data.expires_in,
    };
  }

  async userInfo(accessToken: string): Promise<GoogleAccount> {
    const result = await this.send(GOOGLE_OAUTH_USERINFO_ENDPOINT, {
      method: 'GET',
      headers: {
        [HttpHeader.Authorization]: `Bearer ${accessToken}`,
        [HttpHeader.Accept]: GOOGLE_OAUTH_JSON_CONTENT_TYPE,
      },
      body: null,
    });
    const parsed = userInfoSchema.safeParse(this.json(result));
    if (!parsed.success) {
      throw new GoogleOAuthFailedError({ code: 'userinfo_response_invalid' }, parsed.error);
    }
    return { subject: parsed.data.sub, email: parsed.data.email };
  }

  private async send(
    url: string,
    request: Pick<OutboundHttpRequest, 'method' | 'headers' | 'body'>,
  ): Promise<OutboundHttpResult> {
    const result = await this.http.send({
      ...request,
      url,
      timeoutMs: GOOGLE_OAUTH_TIMEOUT_MS,
    });
    if (result.outcome !== OutboundHttpOutcome.Responded) {
      throw new GoogleOAuthFailedError({ outcome: result.outcome });
    }
    if (
      result.status === null ||
      result.status < HttpStatus.OK ||
      result.status >= HttpStatus.AMBIGUOUS
    ) {
      throw new GoogleOAuthFailedError({ status: result.status });
    }
    if (result.body === null || result.bodyTruncated) {
      throw new GoogleOAuthFailedError({ code: 'response_missing' });
    }
    return result;
  }

  private json(result: OutboundHttpResult): unknown {
    if (result.body === null) {
      return null;
    }
    try {
      return JSON.parse(result.body);
    } catch (cause) {
      throw new GoogleOAuthFailedError({ code: 'response_not_json' }, cause);
    }
  }
}
