import { HttpStatus } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { AppModule } from '@/app/app.module';
import { createApplication } from '@/app/helpers/application.helpers';
import { ChannelMetricName } from '@/modules/channels/constants/channel-metrics.constants';
import { ConversationMetricName } from '@/modules/conversations/constants/conversation-metrics.constants';
import { AuthRoute } from '@/modules/identity/constants/auth-http.constants';
import {
  IdentityMetricLabel,
  IdentityMetricName,
  LoginOutcome,
} from '@/modules/identity/constants/identity-metrics.constants';
import { NotificationMetricName } from '@/modules/notifications/constants/notification-metrics.constants';
import { RunMetricName } from '@/modules/runs/constants/run-metrics.constants';
import { LiveUpdatesMetricName } from '@/platform/live-updates/constants/live-updates-metrics.constants';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { MetricsRoute } from '@/platform/observability/constants/metrics.constants';
import { TracingService } from '@/platform/observability/services/tracing.service';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { TEST_PASSWORD } from '@test/support/constants/identity-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { uniqueEmail } from '@test/support/fixtures/identity.fixture';
import { createIntegrationConfig } from '@test/support/fixtures/integration-env.fixture';
import { fromApp } from '@test/support/helpers/auth-flow.helpers';
import { metricTypeLine, scrapedValue } from '@test/support/helpers/metrics-testing.helpers';
import { apiPath } from '@test/support/helpers/request-layer.helpers';

const METRICS_PATH = `/${MetricsRoute.Path}`;

const DOMAIN_METRICS = [
  RunMetricName.Created,
  RunMetricName.Finished,
  RunMetricName.Duration,
  RunMetricName.QueueWait,
  RunMetricName.Steps,
  RunMetricName.StepDuration,
  ConversationMetricName.MessagesReceived,
  ChannelMetricName.MessagesSent,
  NotificationMetricName.EmailSends,
  IdentityMetricName.Logins,
  LiveUpdatesMetricName.EventsPublished,
];

describe('domain metrics', () => {
  let app: INestApplication | null = null;

  const boot = async (role: Role): Promise<ReturnType<typeof request>> => {
    const config = createIntegrationConfig(
      { role, queues: [QueueName.RunsReactive] },
      TestRedisPrefix.DomainMetrics,
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

  it('declares every domain metric on the api and on the worker', async () => {
    for (const role of [Role.Api, Role.Worker]) {
      const http = await boot(role);

      const { text } = await http.get(METRICS_PATH);

      for (const name of DOMAIN_METRICS) {
        expect(text).toContain(metricTypeLine(name));
      }
      await app?.close();
      app = null;
    }
  });

  it('counts a login that the credentials rejected', async () => {
    const http = await boot(Role.Api);

    const login = await fromApp(http.post(apiPath(AuthRoute.Base, AuthRoute.Login))).send({
      email: uniqueEmail(),
      password: TEST_PASSWORD,
    });
    const { text } = await http.get(METRICS_PATH);

    expect(login.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(
      scrapedValue(text, IdentityMetricName.Logins, {
        [IdentityMetricLabel.Outcome]: LoginOutcome.InvalidCredentials,
      }),
    ).toBe(1);
  });
});
