import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { Test as SupertestRequest } from 'supertest';
import { AppModule } from '@/app/app.module';
import { configureApplication } from '@/app/helpers/application.helpers';
import {
  CONFIRMATION_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from '@/modules/identity/constants/auth-http.constants';
import type { FakeEmailGateway } from '@/modules/notifications/gateways/email.fake';
import { EmailGateway } from '@/modules/notifications/gateways/email.gateway';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import type { RoleSelection } from '@/platform/config/typedefs/app-config.typedefs';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';
import { TracingService } from '@/platform/observability/services/tracing.service';
import { APP_ORIGIN, JSON_CONTENT_TYPE } from '@test/support/constants/auth-flow.constants';
import { CONFIRM_LINK_PATTERN } from '@test/support/constants/identity-testing.constants';
import { TestRedisDatabase } from '@test/support/constants/test-infrastructure.constants';
import { MissingTestDataError } from '@test/support/errors/missing-test-data.error';
import { createIntegrationTestEnv } from '@test/support/fixtures/integration-env.fixture';

const COOKIE_ATTRIBUTE_SEPARATOR = ';';

export const bootRoleWithEmails = async (
  selection: RoleSelection,
  emails: FakeEmailGateway,
  redisDatabase: TestRedisDatabase = TestRedisDatabase.AuthFlow,
): Promise<INestApplication> => {
  const config = loadAppConfig(selection, createIntegrationTestEnv(redisDatabase));
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

export const findCookie = (
  setCookie: string | string[] | undefined,
  name: string,
): string | null => {
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie ?? ''];
  return cookies.find((candidate) => candidate.startsWith(`${name}=`)) ?? null;
};

const requireCookie = (setCookie: string | string[] | undefined, name: string): string => {
  const cookie = findCookie(setCookie, name);
  if (cookie === null) {
    throw new MissingTestDataError(name);
  }
  return cookie;
};

export const refreshCookieOf = (setCookie: string | string[] | undefined): string =>
  requireCookie(setCookie, REFRESH_COOKIE_NAME);

export const confirmationCookieOf = (setCookie: string | string[] | undefined): string =>
  requireCookie(setCookie, CONFIRMATION_COOKIE_NAME);

export const cookiePair = (cookie: string): string =>
  cookie.split(COOKIE_ATTRIBUTE_SEPARATOR)[0] ?? '';

export const confirmationTokenIn = (text: string): string => {
  const token = CONFIRM_LINK_PATTERN.exec(text)?.[1];
  if (token === undefined) {
    throw new MissingTestDataError(text);
  }
  return token;
};

export const fromApp = (pending: SupertestRequest): SupertestRequest =>
  pending.set(HttpHeader.Origin, APP_ORIGIN).set(HttpHeader.ContentType, JSON_CONTENT_TYPE);
