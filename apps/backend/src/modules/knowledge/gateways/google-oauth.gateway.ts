import type {
  GoogleAccount,
  GoogleAuthorizationUrlInput,
  GoogleCodeExchangeInput,
  GoogleTokenSet,
} from '@/modules/knowledge/typedefs/google-oauth.typedefs';

export abstract class GoogleOAuthGateway {
  abstract authorizationUrl(input: GoogleAuthorizationUrlInput): string;

  abstract exchangeCode(input: GoogleCodeExchangeInput): Promise<GoogleTokenSet>;

  abstract userInfo(accessToken: string): Promise<GoogleAccount>;
}
