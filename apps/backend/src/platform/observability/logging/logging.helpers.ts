import { trace } from '@opentelemetry/api';
import type { IncomingMessage } from 'node:http';
import { stdTimeFunctions } from 'pino';
import type { Params } from 'nestjs-pino';

import type { AppConfig } from '@/platform/config/config.typedefs';

import { TRACE_ID_FIELD } from '../observability.constants';
import { isOperationalUrl } from '../observability.helpers';
import { LOG_FIELD_ROLE, LOG_FIELD_SERVICE } from './logging.constants';

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
