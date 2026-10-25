import {
  ERROR_LOG_FIELDS,
  QUERY_PARAM_PATTERN,
  REDACTED_LOG_VALUE,
  SENSITIVE_QUERY_PARAMS,
} from '@/platform/observability/constants/logger.constants';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isSensitiveParam = (name: string): boolean => {
  try {
    return SENSITIVE_QUERY_PARAMS.has(decodeURIComponent(name).toLowerCase());
  } catch {
    return true;
  }
};

export const redactUrlQuery = (url: string): string =>
  url.replace(QUERY_PARAM_PATTERN, (match, separator: string, name: string) =>
    isSensitiveParam(name) ? `${separator}${name}=${REDACTED_LOG_VALUE}` : match,
  );

const redactQueryObject = (query: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(query).map(([name, value]) => [
      name,
      isSensitiveParam(name) ? REDACTED_LOG_VALUE : value,
    ]),
  );

export const serializeRequest = (request: unknown): unknown => {
  if (!isRecord(request)) {
    return request;
  }
  const { url, query } = request;
  return {
    ...request,
    ...(typeof url === 'string' ? { url: redactUrlQuery(url) } : {}),
    ...(isRecord(query) ? { query: redactQueryObject(query) } : {}),
  };
};

export const serializeError = (error: unknown): unknown => {
  if (!isRecord(error)) {
    return error;
  }
  return Object.fromEntries(
    ERROR_LOG_FIELDS.filter((field) => error[field] !== undefined).map((field) => [
      field,
      error[field],
    ]),
  );
};
