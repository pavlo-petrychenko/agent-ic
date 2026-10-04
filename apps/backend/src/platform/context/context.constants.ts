export enum ActorKind {
  User = 'user',
  ApiChannel = 'api-channel',
  System = 'system',
  Anonymous = 'anonymous',
}

export enum SystemReason {
  Job = 'job',
  Schedule = 'schedule',
}

export enum Locale {
  En = 'en',
  Uk = 'uk',
}

export const DEFAULT_LOCALE = Locale.En;
export const BEARER_SCHEME = 'bearer';
export const AUTHORIZATION_SEPARATOR = ' ';
export const LANGUAGE_LIST_SEPARATOR = ',';
export const LANGUAGE_PARAMETER_SEPARATOR = ';';
export const LANGUAGE_SUBTAG_SEPARATOR = '-';
export const LANGUAGE_QUALITY_PREFIX = 'q=';
export const LANGUAGE_DEFAULT_QUALITY = 1;
export const INVALID_ACCESS_TOKEN_MESSAGE = 'The access token is not valid.';
export const ACTOR_DISCRIMINATOR = 'kind';
