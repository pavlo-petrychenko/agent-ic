import { randomBytes } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { trace } from '@opentelemetry/api';
import { resourceFromAttributes } from '@opentelemetry/resources';
import type { Resource } from '@opentelemetry/resources';
import { tracing } from '@opentelemetry/sdk-node';
import {
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { ATTR_SERVICE_NAMESPACE } from '@opentelemetry/semantic-conventions/incubating';
import type { TelemetryConfig } from '@/platform/config/typedefs/app-config.typedefs';
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

export const tracingResource = (telemetry: TelemetryConfig): Resource =>
  resourceFromAttributes({
    [ATTR_SERVICE_NAME]: telemetry.serviceName,
    [ATTR_SERVICE_NAMESPACE]: telemetry.serviceNamespace,
    [ATTR_SERVICE_VERSION]: telemetry.serviceVersion,
    ...(telemetry.deploymentEnvironment === null
      ? {}
      : { [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: telemetry.deploymentEnvironment }),
  });

export const traceSampler = (ratio: number): tracing.Sampler =>
  new tracing.ParentBasedSampler({ root: new tracing.TraceIdRatioBasedSampler(ratio) });
