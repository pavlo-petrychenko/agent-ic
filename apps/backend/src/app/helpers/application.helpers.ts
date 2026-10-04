import type { DynamicModule, INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import {
  LogMessage,
  ROLE_GLOBAL_PREFIX,
  TRUST_PROXY_SETTING,
  UNPREFIXED_ROUTES,
} from '@/app/constants/application.constants';
import type { AppConfig } from '@/platform/config/typedefs/app-config.typedefs';
import { TRUSTED_PROXY_RANGES } from '@/platform/http/constants/trusted-proxy.constants';

export const configureApplication = (
  config: AppConfig,
  app: NestExpressApplication,
): NestExpressApplication => {
  app.useLogger(app.get(Logger));
  app.set(TRUST_PROXY_SETTING, [...TRUSTED_PROXY_RANGES]);
  const globalPrefix = ROLE_GLOBAL_PREFIX[config.role];
  if (globalPrefix !== null) {
    app.setGlobalPrefix(globalPrefix, { exclude: [...UNPREFIXED_ROUTES] });
  }
  return app;
};

export const createApplication = async (
  config: AppConfig,
  root: DynamicModule,
): Promise<INestApplication> =>
  configureApplication(
    config,
    await NestFactory.create<NestExpressApplication>(root, { bufferLogs: true }),
  );

export const startApplication = async (
  config: AppConfig,
  app: INestApplication,
): Promise<INestApplication> => {
  app.enableShutdownHooks();
  await app.listen(config.http.port, config.http.host);
  app.get(Logger).log({
    msg: LogMessage.Listening,
    host: config.http.host,
    port: config.http.port,
  });
  return app;
};
