import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { ApplicationFactory } from '@/entrypoints/application.factory';
import { CliOption } from '@/platform/config/config.constants';
import { ConfigLoader } from '@/platform/config/config.loader';
import { GlobalPrefix } from '@/platform/http/http.constants';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { HealthRoute, HealthStatus } from '@/platform/observability/constants/health.constants';
import { MetricsRoute } from '@/platform/observability/constants/metrics.constants';
import { TracingService } from '@/platform/observability/services/tracing.service';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { TestRedisDatabase } from '@test/support/constants/test-infrastructure.constants';
import { createIntegrationTestEnv } from '@test/support/fixtures/integration-env.fixture';
import { cliArgument, createArgv } from '@test/support/fixtures/test-env.fixture';

const livePath = (prefix = ''): string => `${prefix}/${HealthRoute.Base}/${HealthRoute.Live}`;
const readyPath = (prefix = ''): string => `${prefix}/${HealthRoute.Base}/${HealthRoute.Ready}`;
const metricsPath = (prefix = ''): string => `${prefix}/${MetricsRoute.Path}`;

const bootRole = async (role: Role): Promise<INestApplication> => {
  const config = new ConfigLoader(createIntegrationTestEnv(TestRedisDatabase.Entrypoints)).load(
    createArgv(
      cliArgument(CliOption.Role, role),
      cliArgument(CliOption.Queues, QueueName.RunsReactive),
    ),
  );
  const app = await new ApplicationFactory(config, new TracingService(config.telemetry)).create();
  await app.init();
  return app;
};

describe('role entrypoints', () => {
  let app: INestApplication | null = null;

  const boot = async (role: Role): Promise<ReturnType<typeof request>> => {
    app = await bootRole(role);
    return request(app.getHttpServer());
  };

  afterEach(async () => {
    await app?.close();
    app = null;
  });

  describe(`${Role.Api} role`, () => {
    const prefix = `/${GlobalPrefix.Api}`;

    it('serves the health checks under the global prefix', async () => {
      const http = await boot(Role.Api);

      const live = await http.get(livePath(prefix));
      const ready = await http.get(readyPath(prefix));

      expect(live.status).toBe(200);
      expect(live.body).toEqual({ status: HealthStatus.Ok });
      expect(ready.status).toBe(200);
    });

    it('does not serve the health checks without the prefix', async () => {
      const http = await boot(Role.Api);

      const response = await http.get(livePath());

      expect(response.status).toBe(404);
    });

    it('serves metrics outside the public prefix', async () => {
      const http = await boot(Role.Api);

      const outside = await http.get(metricsPath());
      const inside = await http.get(metricsPath(prefix));

      expect(outside.status).toBe(200);
      expect(inside.status).toBe(404);
    });
  });

  describe(`${Role.Gateway} role`, () => {
    it('serves the health checks without a prefix', async () => {
      const http = await boot(Role.Gateway);

      const live = await http.get(livePath());
      const ready = await http.get(readyPath());

      expect(live.status).toBe(200);
      expect(ready.status).toBe(200);
    });

    it('serves metrics', async () => {
      const http = await boot(Role.Gateway);

      const response = await http.get(metricsPath());

      expect(response.status).toBe(200);
    });

    it('does not serve the api prefix', async () => {
      const http = await boot(Role.Gateway);

      const response = await http.get(livePath(`/${GlobalPrefix.Api}`));

      expect(response.status).toBe(404);
    });
  });

  describe(`${Role.Worker} role`, () => {
    it('serves the health checks and metrics for its operators', async () => {
      const http = await boot(Role.Worker);

      const live = await http.get(livePath());
      const ready = await http.get(readyPath());
      const metrics = await http.get(metricsPath());

      expect(live.status).toBe(200);
      expect(ready.status).toBe(200);
      expect(metrics.status).toBe(200);
    });
  });

  it('labels metrics with the role', async () => {
    const http = await boot(Role.Gateway);

    const response = await http.get(metricsPath());

    expect(response.text).toContain(`role="${Role.Gateway}"`);
  });
});
