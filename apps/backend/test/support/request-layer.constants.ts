export enum FailingRoute {
  Base = 'failing',
  NotFound = 'not-found',
  Validation = 'validation',
}

export const SERVER_STATUS_QUERY = '{ serverStatus { version uptimeSeconds } }';
export const UNKNOWN_ROUTE = 'unknown-route';
export const INVALID_BEARER = 'Bearer not-a-real-token';
export const EPHEMERAL_PORT = 0;
export const LOOPBACK_HOST = '127.0.0.1';
export const WEBSOCKET_PROTOCOL = 'ws:';
export const WEBSOCKET_NO_RESULT_MESSAGE = 'The WebSocket operation completed without a result.';
