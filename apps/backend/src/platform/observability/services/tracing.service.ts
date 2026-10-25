import type { OnApplicationShutdown } from '@nestjs/common';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';
import type { TelemetryConfig } from '@/platform/config/typedefs/app-config.typedefs';
import { registerInstrumentationHooks } from '@/platform/observability/helpers/instrumentation-hooks.helpers';
import { createInstrumentations } from '@/platform/observability/helpers/instrumentation.helpers';
import {
  traceSampler,
  tracesEndpoint,
  tracingResource,
} from '@/platform/observability/helpers/tracing.helpers';

export class TracingService implements OnApplicationShutdown {
  private sdk: NodeSDK | null = null;

  constructor(private readonly telemetry: TelemetryConfig) {}

  start(): void {
    if (!this.telemetry.enabled || this.telemetry.endpoint === null) {
      return;
    }
    const instrumentations = createInstrumentations();
    registerInstrumentationHooks(instrumentations);
    this.sdk = new NodeSDK({
      resource: tracingResource(this.telemetry),
      sampler: traceSampler(this.telemetry.samplerRatio),
      traceExporter: new OTLPTraceExporter({ url: tracesEndpoint(this.telemetry.endpoint) }),
      metricReaders: [],
      logRecordProcessors: [],
      instrumentations,
    });
    this.sdk.start();
  }

  async shutdown(): Promise<void> {
    await this.sdk?.shutdown();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.shutdown();
  }
}
