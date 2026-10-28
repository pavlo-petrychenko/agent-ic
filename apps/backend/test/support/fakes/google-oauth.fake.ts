import { GoogleOAuthGateway } from '@/modules/knowledge/gateways/google-oauth.gateway';
import type {
  GoogleAccessToken,
  GoogleAccount,
  GoogleAuthorizationUrlInput,
  GoogleCodeExchangeInput,
  GoogleTokenSet,
} from '@/modules/knowledge/typedefs/google-oauth.typedefs';
import {
  TEST_CONNECTION_EMAIL,
  TEST_CONNECTION_SUBJECT,
  TEST_GOOGLE_ACCESS_TOKEN,
  TEST_GOOGLE_AUTHORIZATION_URL,
  TEST_GOOGLE_REFRESH_TOKEN,
  TEST_GOOGLE_SCOPE,
} from '@test/support/constants/knowledge-testing.constants';

export class FakeGoogleOAuthGateway extends GoogleOAuthGateway {
  readonly authorizationInputs: GoogleAuthorizationUrlInput[] = [];
  readonly exchangeInputs: GoogleCodeExchangeInput[] = [];
  readonly refreshInputs: string[] = [];
  readonly accessTokens: string[] = [];
  private tokenSet: GoogleTokenSet = {
    accessToken: TEST_GOOGLE_ACCESS_TOKEN,
    refreshToken: TEST_GOOGLE_REFRESH_TOKEN,
    scopes: TEST_GOOGLE_SCOPE.split(' '),
    expiresInSeconds: 3600,
  };
  private account: GoogleAccount = {
    subject: TEST_CONNECTION_SUBJECT,
    email: TEST_CONNECTION_EMAIL,
  };
  private accessToken: GoogleAccessToken = {
    accessToken: TEST_GOOGLE_ACCESS_TOKEN,
    expiresInSeconds: 3600,
  };
  private failure: Error | null = null;

  authorizationUrl(input: GoogleAuthorizationUrlInput): string {
    this.authorizationInputs.push(input);
    return `${TEST_GOOGLE_AUTHORIZATION_URL}?state=${input.state}`;
  }

  async exchangeCode(input: GoogleCodeExchangeInput): Promise<GoogleTokenSet> {
    this.exchangeInputs.push(input);
    this.throwWhenFailed();
    return this.tokenSet;
  }

  async refreshAccessToken(refreshToken: string): Promise<GoogleAccessToken> {
    this.refreshInputs.push(refreshToken);
    this.throwWhenFailed();
    return this.accessToken;
  }

  async userInfo(accessToken: string): Promise<GoogleAccount> {
    this.accessTokens.push(accessToken);
    this.throwWhenFailed();
    return this.account;
  }

  setAccessToken(token: GoogleAccessToken): void {
    this.accessToken = token;
  }

  setTokens(tokens: Partial<GoogleTokenSet>): void {
    this.tokenSet = { ...this.tokenSet, ...tokens };
  }

  setAccount(account: GoogleAccount): void {
    this.account = account;
  }

  failWith(error: Error): void {
    this.failure = error;
  }

  private throwWhenFailed(): void {
    if (this.failure !== null) {
      throw this.failure;
    }
  }
}
