import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/app/app.module';
import { configureApplication } from '@/app/helpers/application.helpers';
import { REFRESH_COOKIE_NAME } from '@/modules/identity/constants/auth-http.constants';
import type { FakeEmailGateway } from '@/modules/notifications/gateways/email.fake';
import { EmailGateway } from '@/modules/notifications/gateways/email.gateway';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import type { RoleSelection } from '@/platform/config/typedefs/app-config.typedefs';
import { TracingService } from '@/platform/observability/services/tracing.service';
import { CONFIRM_LINK_PATTERN } from '@test/support/constants/identity-testing.constants';
import { TestRedisDatabase } from '@test/support/constants/test-infrastructure.constants';
import { MissingTestDataError } from '@test/support/errors/missing-test-data.error';
import { createIntegrationTestEnv } from '@test/support/fixtures/integration-env.fixture';

const COOKIE_ATTRIBUTE_SEPARATOR = ';';

export const bootRoleWithEmails = async (
  selection: RoleSelection,
  emails: FakeEmailGateway,
): Promise<INestApplication> => {
  const config = loadAppConfig(selection, createIntegrationTestEnv(TestRedisDatabase.AuthFlow));
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule.forRole(config, new TracingService(config.telemetry))],
  })
    .overrideProvider(EmailGateway)
    .useValue(emails)
    .compile();
  const app = configureApplication(
    config,
    moduleRef.createNestApplication<NestExpressApplication>({ bufferLogs: true }),
  );
  return app.init();
};

export const refreshCookieOf = (setCookie: string | string[] | undefined): string => {
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie ?? ''];
  const cookie = cookies.find((candidate) => candidate.startsWith(`${REFRESH_COOKIE_NAME}=`));
  if (cookie === undefined) {
    throw new MissingTestDataError(REFRESH_COOKIE_NAME);
  }
  return cookie;
};

export const cookiePair = (cookie: string): string =>
  cookie.split(COOKIE_ATTRIBUTE_SEPARATOR)[0] ?? '';

export const confirmationTokenIn = (text: string): string => {
  const token = CONFIRM_LINK_PATTERN.exec(text)?.[1];
  if (token === undefined) {
    throw new MissingTestDataError(text);
  }
  return token;
};
