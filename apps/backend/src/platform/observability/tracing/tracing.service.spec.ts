import { describe, expect, it } from 'vitest';
import type { TelemetryConfig } from '@/platform/config/config.typedefs';
import { TracingService } from '@/platform/observability/tracing/tracing.service';

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
});
