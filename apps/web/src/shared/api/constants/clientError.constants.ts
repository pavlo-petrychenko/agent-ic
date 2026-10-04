export enum ClientErrorCode {
  Network = 'NETWORK',
  Unknown = 'UNKNOWN',
}

export const NETWORK_ERROR_MESSAGE = 'The server could not be reached.';
export const UNKNOWN_ERROR_MESSAGE = 'An unexpected error occurred.';
export const CONFIG_FETCH_FAILED_MESSAGE = 'The runtime config could not be loaded.';
