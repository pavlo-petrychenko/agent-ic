export enum GoogleOAuthParam {
  ClientId = 'client_id',
  ClientSecret = 'client_secret',
  RedirectUri = 'redirect_uri',
  ResponseType = 'response_type',
  Scope = 'scope',
  State = 'state',
  CodeChallenge = 'code_challenge',
  CodeChallengeMethod = 'code_challenge_method',
  AccessType = 'access_type',
  Prompt = 'prompt',
  IncludeGrantedScopes = 'include_granted_scopes',
  Code = 'code',
  GrantType = 'grant_type',
  CodeVerifier = 'code_verifier',
  RefreshToken = 'refresh_token',
}

export const GOOGLE_OAUTH_AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_OAUTH_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
export const GOOGLE_OAUTH_USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo';
export const GOOGLE_OAUTH_SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/drive.file',
] as const;
export const GOOGLE_OAUTH_SCOPE_SEPARATOR = ' ';
export const GOOGLE_OAUTH_STATE_TTL_SECONDS = 10 * 60;
export const GOOGLE_OAUTH_TIMEOUT_MS = 10_000;
export const GOOGLE_OAUTH_STATE_MAX_LENGTH = 256;
export const GOOGLE_OAUTH_CODE_MAX_LENGTH = 4096;
export const GOOGLE_OAUTH_CODE_VERIFIER_MIN_LENGTH = 43;
export const GOOGLE_OAUTH_CODE_VERIFIER_MAX_LENGTH = 128;
export const GOOGLE_OAUTH_RESPONSE_TYPE_CODE = 'code';
export const GOOGLE_OAUTH_ACCESS_TYPE_OFFLINE = 'offline';
export const GOOGLE_OAUTH_PROMPT_CONSENT = 'consent';
export const GOOGLE_OAUTH_INCLUDE_GRANTED_SCOPES = 'true';
export const GOOGLE_OAUTH_CODE_CHALLENGE_METHOD = 'S256';
export const GOOGLE_OAUTH_GRANT_TYPE_AUTHORIZATION_CODE = 'authorization_code';
export const GOOGLE_OAUTH_GRANT_TYPE_REFRESH_TOKEN = 'refresh_token';
export const GOOGLE_OAUTH_FORM_CONTENT_TYPE = 'application/x-www-form-urlencoded';
export const GOOGLE_OAUTH_JSON_CONTENT_TYPE = 'application/json';
export const GOOGLE_OAUTH_CACHE_NAME = 'knowledge-google-oauth-state';
export const GOOGLE_OAUTH_CHALLENGE_ALGORITHM = 'sha256';
export const GOOGLE_OAUTH_CHALLENGE_ENCODING = 'base64url';
