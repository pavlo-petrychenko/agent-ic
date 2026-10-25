import { REDACTED_LOG_VALUE } from '@/platform/observability/constants/logger.constants';

export const OTLP_TRACES_PATH = '/v1/traces';
export const TRACE_ID_BYTES = 16;
export const TRACE_ID_ENCODING = 'hex';
export const GRAPHQL_SPAN_DEPTH = 2;
export const BOT_TOKEN_PATH_PATTERN = /^\/bot[^/]+/;
export const BOT_TOKEN_PATH_MASK = `/bot${REDACTED_LOG_VALUE}`;
