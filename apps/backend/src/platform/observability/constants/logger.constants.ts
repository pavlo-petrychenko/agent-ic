export const LOG_FIELD_ROLE = 'role';
export const LOG_FIELD_SERVICE = 'service';
export const TRACE_ID_FIELD = 'traceId';
export const REDACTED_LOG_VALUE = '[redacted]';
export const REDACTED_LOG_PATHS: readonly string[] = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
];
