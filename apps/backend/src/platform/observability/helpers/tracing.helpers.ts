import { randomBytes } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { trace } from '@opentelemetry/api';
import {
  OTLP_TRACES_PATH,
  TRACE_ID_BYTES,
  TRACE_ID_ENCODING,
} from '@/platform/observability/constants/tracing.constants';
import { isOperationalUrl } from '@/platform/observability/helpers/operational-url.helpers';

export const tracesEndpoint = (endpoint: string): string =>
  new URL(OTLP_TRACES_PATH, endpoint).toString();

export const ignoreOperationalRequest = (request: IncomingMessage): boolean =>
  isOperationalUrl(request.url);

export const resolveTraceId = (): string =>
  trace.getActiveSpan()?.spanContext().traceId ??
  randomBytes(TRACE_ID_BYTES).toString(TRACE_ID_ENCODING);
