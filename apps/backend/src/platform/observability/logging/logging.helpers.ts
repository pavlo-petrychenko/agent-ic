import type { IncomingMessage } from 'node:http';
import { trace } from '@opentelemetry/api';
import type { Params } from 'nestjs-pino';
import { stdTimeFunctions } from 'pino';
import type { AppConfig } from '@/platform/config/config.typedefs';
import {
  LOG_FIELD_ROLE,
  LOG_FIELD_SERVICE,
} from '@/platform/observability/logging/logging.constants';
import { TRACE_ID_FIELD } from '@/platform/observability/observability.constants';
import { isOperationalUrl } from '@/platform/observability/observability.helpers';

export const traceContextMixin = (): Record<string, string> => {
  const spanContext = trace.getActiveSpan()?.spanContext();
  return spanContext === undefined ? {} : { [TRACE_ID_FIELD]: spanContext.traceId };
};

export const createLoggerParams = (config: AppConfig): Params => ({
  pinoHttp: {
    level: config.logLevel,
    base: {
      [LOG_FIELD_ROLE]: config.role,
      [LOG_FIELD_SERVICE]: config.telemetry.serviceName,
    },
    timestamp: stdTimeFunctions.isoTime,
    mixin: traceContextMixin,
    autoLogging: {
      ignore: (request: IncomingMessage) => isOperationalUrl(request.url),
    },
  },
});
