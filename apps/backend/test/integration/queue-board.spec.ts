import { ErrorReason } from '@agent-ic/contracts';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { ApiAppModule } from '@/entrypoints/api.app-module';
import { EnvVar } from '@/platform/config/config.constants';
import { PROBLEM_CONTENT_TYPE } from '@/platform/errors/errors.constants';
import { HttpHeader } from '@/platform/http/http.constants';
import { MetricsRoute } from '@/platform/observability/metrics/metrics.constants';
import { QueueBoardRoute } from '@/platform/queues/board/queue-board.constants';
import { QueueMetricName } from '@/platform/queues/metrics/queue-metrics.constants';
import { QueueName } from '@/platform/queues/queue.constants';
import {
  BOARD_QUEUES_API_SEGMENT,
  HTML_CONTENT_TYPE,
} from '@test/support/constants/queue-board.constants';
import { INVALID_BEARER } from '@test/support/constants/request-layer.constants';
import { TestRedisDatabase } from '@test/support/constants/test-infrastructure.constants';
import { createIntegrationTestEnv } from '@test/support/fixtures/integration-env.fixture';
import { apiPath, createApi } from '@test/support/helpers/request-layer.helpers';

describe('queue board', () => {
  let app: INestApplication | null = null;

  const boot = async (devAccess: boolean): Promise<ReturnType<typeof request>> => {
    const env = createIntegrationTestEnv(TestRedisDatabase.QueueBoard, {
      [EnvVar.PlatformAdminDevAccess]: String(devAccess),
    });
    app = await createApi(ApiAppModule, env);
    await app.init();
    return request(app.getHttpServer());
  };

  afterEach(async () => {
    await app?.close();
    app = null;
  });

  it('refuses everyone until platform admins exist', async () => {
    const http = await boot(false);

    const response = await http.get(apiPath(QueueBoardRoute.Base));

    expect(response.status).toBe(403);
    expect(response.headers['content-type']).toContain(PROBLEM_CONTENT_TYPE);
    expect(response.body.reason).toBe(ErrorReason.PlatformAdminRequired);
  });

  it('refuses the board api as well', async () => {
    const http = await boot(false);

    const response = await http.get(apiPath(QueueBoardRoute.Base, BOARD_QUEUES_API_SEGMENT));

    expect(response.status).toBe(403);
  });

  it('rejects an invalid token before checking the role', async () => {
    const http = await boot(false);

    const response = await http
      .get(apiPath(QueueBoardRoute.Base))
      .set(HttpHeader.Authorization, INVALID_BEARER);

    expect(response.status).toBe(401);
  });

  it('serves the board with the dev access flag', async () => {
    const http = await boot(true);

    const page = await http.get(apiPath(QueueBoardRoute.Base));
    const queues = await http.get(apiPath(QueueBoardRoute.Base, BOARD_QUEUES_API_SEGMENT));

    expect(page.status).toBe(200);
    expect(page.headers['content-type']).toMatch(HTML_CONTENT_TYPE);
    expect(queues.status).toBe(200);
    expect(queues.body.queues.map((queue: { name: string }) => queue.name).toSorted()).toEqual(
      Object.values(QueueName).toSorted(),
    );
  });

  it('reports waiting jobs per queue on the metrics endpoint', async () => {
    const http = await boot(false);

    const response = await http.get(`/${MetricsRoute.Path}`);

    expect(response.status).toBe(200);
    for (const queue of Object.values(QueueName)) {
      expect(response.text).toContain(`${QueueMetricName.WaitingJobs}{queue="${queue}"`);
      expect(response.text).toContain(`${QueueMetricName.OldestWaitingJobAge}{queue="${queue}"`);
    }
  });
});
