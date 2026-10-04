import { describe, expect, it, vi } from 'vitest';
import type { TelemetryConfig } from '@/platform/config/typedefs/app-config.typedefs';
import { TracingService } from '@/platform/observability/services/tracing.service';

const disabledTelemetry: TelemetryConfig = {
  enabled: false,
  endpoint: 'http://localhost:4318',
  serviceName: 'test-service',
  serviceNamespace: 'test-namespace',
};

describe('TracingService', () => {
  it('starts and shuts down without side effects when telemetry is disabled', async () => {
    const tracing = new TracingService(disabledTelemetry);

    tracing.start();

    await expect(tracing.shutdown()).resolves.toBeUndefined();
  });

  it('shuts the tracer down when the application shuts down', async () => {
    const tracing = new TracingService(disabledTelemetry);
    const shutdown = vi.spyOn(tracing, 'shutdown');

    await tracing.onApplicationShutdown();

    expect(shutdown).toHaveBeenCalledOnce();
  });
});
