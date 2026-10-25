import { ROOT_CONTEXT, SpanKind, trace, TraceFlags } from '@opentelemetry/api';
import { tracing } from '@opentelemetry/sdk-node';
import {
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { describe, expect, it } from 'vitest';
import type { TelemetryConfig } from '@/platform/config/typedefs/app-config.typedefs';
import { OTLP_TRACES_PATH } from '@/platform/observability/constants/tracing.constants';
import {
  traceSampler,
  tracesEndpoint,
  tracingResource,
} from '@/platform/observability/helpers/tracing.helpers';

const TELEMETRY: TelemetryConfig = {
  enabled: true,
  endpoint: 'http://collector.internal:4318',
  serviceName: 'api',
  serviceNamespace: 'agent-ic',
  serviceVersion: '1.2.3',
  deploymentEnvironment: 'staging',
  samplerRatio: 1,
};

const TRACE_ID = 'a'.repeat(32);

const SPAN_ID = 'b'.repeat(16);

const SPAN_NAME = 'request';

const sampledParent = trace.setSpanContext(ROOT_CONTEXT, {
  traceId: TRACE_ID,
  spanId: SPAN_ID,
  traceFlags: TraceFlags.SAMPLED,
});

const decisionOf = (ratio: number, parent = ROOT_CONTEXT): tracing.SamplingDecision =>
  traceSampler(ratio).shouldSample(parent, TRACE_ID, SPAN_NAME, SpanKind.SERVER, {}, []).decision;

describe('tracesEndpoint', () => {
  it('appends the traces path to the collector endpoint', () => {
    const endpoint = new URL('http://collector.internal:4318');

    expect(tracesEndpoint(endpoint.origin)).toBe(new URL(OTLP_TRACES_PATH, endpoint).toString());
  });

  it('replaces any path on the collector endpoint', () => {
    const endpoint = new URL('http://collector.internal:4318/ignored');

    expect(tracesEndpoint(endpoint.toString())).toBe(
      new URL(OTLP_TRACES_PATH, endpoint.origin).toString(),
    );
  });
});

describe('tracingResource', () => {
  it('names the service, its version and the deployment environment', () => {
    expect(tracingResource(TELEMETRY).attributes).toMatchObject({
      [ATTR_SERVICE_NAME]: TELEMETRY.serviceName,
      [ATTR_SERVICE_VERSION]: TELEMETRY.serviceVersion,
      [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: TELEMETRY.deploymentEnvironment,
    });
  });

  it('leaves the deployment environment out when it is not set', () => {
    const attributes = tracingResource({ ...TELEMETRY, deploymentEnvironment: null }).attributes;

    expect(attributes).not.toHaveProperty(ATTR_DEPLOYMENT_ENVIRONMENT_NAME);
  });
});

describe('traceSampler', () => {
  it('samples a root span by the ratio', () => {
    expect(decisionOf(1)).toBe(tracing.SamplingDecision.RECORD_AND_SAMPLED);
    expect(decisionOf(0)).toBe(tracing.SamplingDecision.NOT_RECORD);
  });

  it('follows a sampled parent whatever the ratio', () => {
    expect(decisionOf(0, sampledParent)).toBe(tracing.SamplingDecision.RECORD_AND_SAMPLED);
  });
});
