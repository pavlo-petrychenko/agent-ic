import type { Attributes } from '@opentelemetry/api';
import type { InstrumentationBase } from '@opentelemetry/instrumentation';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';
import type { UndiciRequest } from '@opentelemetry/instrumentation-undici';
import { ATTR_URL_FULL, ATTR_URL_PATH } from '@opentelemetry/semantic-conventions';
import {
  BOT_TOKEN_PATH_MASK,
  BOT_TOKEN_PATH_PATTERN,
  GRAPHQL_SPAN_DEPTH,
} from '@/platform/observability/constants/tracing.constants';
import { ignoreOperationalRequest } from '@/platform/observability/helpers/tracing.helpers';

export const maskBotTokenUrl = ({
  origin,
  path,
}: Pick<UndiciRequest, 'origin' | 'path'>): Attributes => {
  if (!BOT_TOKEN_PATH_PATTERN.test(path)) {
    return {};
  }
  const url = new URL(path.replace(BOT_TOKEN_PATH_PATTERN, BOT_TOKEN_PATH_MASK), origin);
  return { [ATTR_URL_FULL]: url.toString(), [ATTR_URL_PATH]: url.pathname };
};

export const createInstrumentations = (): InstrumentationBase[] => [
  new HttpInstrumentation({ ignoreIncomingRequestHook: ignoreOperationalRequest }),
  new ExpressInstrumentation(),
  new UndiciInstrumentation({ startSpanHook: maskBotTokenUrl }),
  new IORedisInstrumentation({ requireParentSpan: true }),
  new GraphQLInstrumentation({
    ignoreTrivialResolveSpans: true,
    depth: GRAPHQL_SPAN_DEPTH,
    allowValues: false,
  }),
  new PgInstrumentation({ requireParentSpan: true, enhancedDatabaseReporting: false }),
];
