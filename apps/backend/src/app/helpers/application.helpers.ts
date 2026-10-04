import type { DynamicModule, INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import {
  LogMessage,
  ROLE_GLOBAL_PREFIX,
  UNPREFIXED_ROUTES,
} from '@/app/constants/application.constants';
import type { AppConfig } from '@/platform/config/typedefs/app-config.typedefs';

export const createApplication = async (
  config: AppConfig,
  root: DynamicModule,
): Promise<INestApplication> => {
  const app = await NestFactory.create(root, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  const globalPrefix = ROLE_GLOBAL_PREFIX[config.role];
  if (globalPrefix !== null) {
    app.setGlobalPrefix(globalPrefix, { exclude: [...UNPREFIXED_ROUTES] });
  }
  return app;
};

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
