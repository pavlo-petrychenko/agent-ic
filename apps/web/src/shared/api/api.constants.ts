export enum ClientErrorCode {
  Network = 'NETWORK',
  Unknown = 'UNKNOWN',
}

export enum RequestHeader {
  Authorization = 'authorization',
  WorkspaceId = 'x-workspace-id',
}

export enum UrlScheme {
  Http = 'http:',
  Https = 'https:',
  Ws = 'ws:',
  Wss = 'wss:',
}

export const BEARER_SCHEME = 'Bearer';
export const CONNECTION_AUTH_PARAM = 'authorization';
export const UNAUTHENTICATED_RETRIED_CONTEXT_KEY = 'unauthenticatedRetried';
export const NETWORK_ERROR_MESSAGE = 'The server could not be reached.';
export const UNKNOWN_ERROR_MESSAGE = 'An unexpected error occurred.';
export const CONFIG_FETCH_FAILED_MESSAGE = 'The runtime config could not be loaded.';
