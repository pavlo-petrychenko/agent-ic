import { HttpStatus } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { AppModule } from '@/app/app.module';
import { createApplication } from '@/app/helpers/application.helpers';
import { CacheMetricName } from '@/platform/cache/constants/cache-metrics.constants';
import { DatabaseMetricName } from '@/platform/database/constants/database-metrics.constants';
import { GraphqlMetricName } from '@/platform/graphql-server/constants/graphql-metrics.constants';
import { Role } from '@/platform/module-roles/constants/role.constants';
import {
  HttpMetricName,
  UNMATCHED_ROUTE,
} from '@/platform/observability/constants/http-metrics.constants';
import { MetricsRoute } from '@/platform/observability/constants/metrics.constants';
import { TracingService } from '@/platform/observability/services/tracing.service';
import { JobMetricName } from '@/platform/queues/constants/job-metrics.constants';
import { OutboxMetricName } from '@/platform/queues/constants/outbox.constants';
import { QueueMetricName } from '@/platform/queues/constants/queue-metrics.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { RateLimitMetricName } from '@/platform/rate-limit/constants/rate-limit-metrics.constants';
import {
  SERVER_STATUS_QUERY,
  UNKNOWN_ROUTE,
} from '@test/support/constants/request-layer.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { createIntegrationConfig } from '@test/support/fixtures/integration-env.fixture';
import { metricTypeLine, scrapedValue } from '@test/support/helpers/metrics-testing.helpers';
import { graphqlPath } from '@test/support/helpers/request-layer.helpers';

const METRICS_PATH = `/${MetricsRoute.Path}`;
const CONTENT_TYPE = 'content-type';
const OPENMETRICS_END = '# EOF';
const OPENMETRICS_MIME = 'application/openmetrics-text';
const OPENMETRICS_VERSION = 'version=1.0.0';

describe('platform metrics', () => {
  let app: INestApplication | null = null;

  const boot = async (role: Role): Promise<ReturnType<typeof request>> => {
    const config = createIntegrationConfig(
      { role, queues: [QueueName.RunsReactive] },
      TestRedisPrefix.PlatformMetrics,
    );
    app = await createApplication(
      config,
      AppModule.forRole(config, new TracingService(config.telemetry)),
    );
    await app.init();
    return request(app.getHttpServer());
  };

  afterEach(async () => {
    await app?.close();
    app = null;
  });

  it('serves the api metrics in the OpenMetrics format', async () => {
    const http = await boot(Role.Api);

    const response = await http.get(METRICS_PATH);

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.headers[CONTENT_TYPE]).toContain(OPENMETRICS_MIME);
    expect(response.headers[CONTENT_TYPE]).toContain(OPENMETRICS_VERSION);
    expect(response.text.trimEnd().endsWith(OPENMETRICS_END)).toBe(true);
  });

  it('counts the requests and GraphQL operations the api served', async () => {
    const http = await boot(Role.Api);

    await http.post(graphqlPath()).send({ query: SERVER_STATUS_QUERY });
    await http.get(`/${UNKNOWN_ROUTE}`);
    const { text } = await http.get(METRICS_PATH);

    expect(
      scrapedValue(text, HttpMetricName.Requests, {
        method: 'POST',
        route: graphqlPath(),
        status_class: '2xx',
      }),
    ).toBe(1);
    expect(
      scrapedValue(text, HttpMetricName.Requests, {
        route: UNMATCHED_ROUTE,
        status_class: '4xx',
      }),
    ).toBe(1);
    expect(
      scrapedValue(text, GraphqlMetricName.Operations, {
        type: 'query',
        root_field: 'serverStatus',
        outcome: 'success',
      }),
    ).toBe(1);
    expect(scrapedValue(text, HttpMetricName.Requests, { route: METRICS_PATH })).toBeNull();
  });

  it('reports the queues, the database pools and the platform counters on the api', async () => {
    const http = await boot(Role.Api);

    const { text } = await http.get(METRICS_PATH);

    for (const name of [
      GraphqlMetricName.WsConnections,
      CacheMetricName.Requests,
      RateLimitMetricName.Rejections,
    ]) {
      expect(text).toContain(metricTypeLine(name));
    }
    for (const queue of Object.values(QueueName)) {
      expect(
        scrapedValue(text, QueueMetricName.Jobs, { queue, state: 'waiting', role: Role.Api }),
      ).toBe(0);
    }
    expect(
      scrapedValue(text, DatabaseMetricName.PoolConnections, { pool: 'app', state: 'total' }),
    ).not.toBeNull();
  });

  it('reports the jobs and the outbox on the worker', async () => {
    const http = await boot(Role.Worker);

    const { text } = await http.get(METRICS_PATH);

    for (const name of [
      JobMetricName.Processed,
      JobMetricName.Duration,
      JobMetricName.Wait,
      JobMetricName.Active,
      OutboxMetricName.SweptMessages,
    ]) {
      expect(text).toContain(metricTypeLine(name));
    }
    expect(scrapedValue(text, OutboxMetricName.PendingMessages, { role: Role.Worker })).toBe(0);
    expect(scrapedValue(text, OutboxMetricName.OldestMessageAge, { role: Role.Worker })).toBe(0);
  });
});
