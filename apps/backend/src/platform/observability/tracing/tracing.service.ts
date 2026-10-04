import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { ATTR_SERVICE_NAMESPACE } from '@opentelemetry/semantic-conventions/incubating';

import type { TelemetryConfig } from '@/platform/config/config.typedefs';

import { ignoreOperationalRequest, tracesEndpoint } from './tracing.helpers';

export class TracingService {
  private sdk: NodeSDK | null = null;

  constructor(private readonly telemetry: TelemetryConfig) {}

  start(): void {
    if (!this.telemetry.enabled) {
      return;
    }
    this.sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: this.telemetry.serviceName,
        [ATTR_SERVICE_NAMESPACE]: this.telemetry.serviceNamespace,
      }),
      traceExporter: new OTLPTraceExporter({ url: tracesEndpoint(this.telemetry.endpoint) }),
      metricReaders: [],
      logRecordProcessors: [],
      instrumentations: [
        new HttpInstrumentation({ ignoreIncomingRequestHook: ignoreOperationalRequest }),
        new ExpressInstrumentation(),
      ],
    });
    this.sdk.start();
  }

  async shutdown(): Promise<void> {
    await this.sdk?.shutdown();
  }
}
