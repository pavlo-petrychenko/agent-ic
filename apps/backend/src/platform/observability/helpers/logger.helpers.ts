import type { IncomingMessage } from 'node:http';
import { trace } from '@opentelemetry/api';
import type { Params } from 'nestjs-pino';
import { stdTimeFunctions } from 'pino';
import type { Options } from 'pino-http';
import type { AppConfig } from '@/platform/config/typedefs/app-config.typedefs';
import {
  LOG_FIELD_ROLE,
  LOG_FIELD_SERVICE,
  REDACTED_LOG_PATHS,
  REDACTED_LOG_VALUE,
  SPAN_ID_FIELD,
  TRACE_ID_FIELD,
} from '@/platform/observability/constants/logger.constants';
import {
  serializeError,
  serializeRequest,
} from '@/platform/observability/helpers/log-serializers.helpers';
import { isOperationalUrl } from '@/platform/observability/helpers/operational-url.helpers';
import type { LogContextService } from '@/platform/observability/services/log-context.service';

const correlationFields = (requestId: string | undefined): Record<string, string> => {
  const spanContext = trace.getActiveSpan()?.spanContext();
  if (spanContext !== undefined) {
    return { [TRACE_ID_FIELD]: spanContext.traceId, [SPAN_ID_FIELD]: spanContext.spanId };
  }
  return requestId === undefined ? {} : { [TRACE_ID_FIELD]: requestId };
};

export const createLogMixin = (logContext: LogContextService) => (): Record<string, string> => ({
  ...correlationFields(logContext.requestId()),
  ...logContext.fields(),
});

export const createHttpLoggerOptions = (
  config: AppConfig,
  logContext: LogContextService,
): Options => ({
  level: config.logLevel,
  base: {
    [LOG_FIELD_ROLE]: config.role,
    [LOG_FIELD_SERVICE]: config.telemetry.serviceName,
  },
  timestamp: stdTimeFunctions.isoTime,
  mixin: createLogMixin(logContext),
  serializers: { req: serializeRequest, err: serializeError },
  redact: { paths: [...REDACTED_LOG_PATHS], censor: REDACTED_LOG_VALUE },
  autoLogging: {
    ignore: (request: IncomingMessage) => isOperationalUrl(request.url),
  },
});

export const createLoggerParams = (config: AppConfig, logContext: LogContextService): Params => ({
  pinoHttp: createHttpLoggerOptions(config, logContext),
});
