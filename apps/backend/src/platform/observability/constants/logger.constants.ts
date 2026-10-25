import { HttpHeader } from '@/platform/http/constants/http-header.constants';

export const LOG_FIELD_ROLE = 'role';
export const LOG_FIELD_SERVICE = 'service';
export const TRACE_ID_FIELD = 'traceId';
export const SPAN_ID_FIELD = 'spanId';
export const LOG_CONTEXT_CLS_KEY = 'logContext';
export const REDACTED_LOG_VALUE = '[redacted]';
export const REDACTED_LOG_PATHS: readonly string[] = [
  'req.headers.authorization',
  'req.headers.cookie',
  `req.headers["${HttpHeader.TelegramSecretToken}"]`,
  'res.headers["set-cookie"]',
];
export const SENSITIVE_QUERY_PARAMS: ReadonlySet<string> = new Set([
  'token',
  'access_token',
  'refresh_token',
  'id_token',
  'secret',
  'key',
  'api_key',
  'apikey',
  'code',
  'password',
  'signature',
]);
export const QUERY_PARAM_PATTERN = /([?&])([^=&#]+)=([^&#]*)/g;
export const ERROR_LOG_FIELDS = ['type', 'message', 'stack', 'code'] as const;

export enum LogContextField {
  WorkspaceId = 'workspaceId',
  RunId = 'runId',
  ConversationId = 'conversationId',
}
