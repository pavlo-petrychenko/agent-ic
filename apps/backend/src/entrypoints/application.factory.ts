import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

import type { AppConfig } from '@/platform/config/config.typedefs';
import type { TracingService } from '@/platform/observability/tracing/tracing.service';

import { ROLE_ENTRYPOINTS, UNPREFIXED_ROUTES } from './entrypoint.constants';
import { LogMessage } from './launcher.constants';
import type { RoleEntrypoint } from './entrypoint.typedefs';
import { RootModule } from './root.module';

export class ApplicationFactory {
  constructor(
    private readonly config: AppConfig,
    private readonly tracing: TracingService,
    private readonly entrypoint: RoleEntrypoint = ROLE_ENTRYPOINTS[config.role],
  ) {}

  async create(): Promise<INestApplication> {
    const { entrypoint } = this;
    const app = await NestFactory.create(
      RootModule.forRole(this.config, this.tracing, entrypoint.module),
      { bufferLogs: true },
    );
    app.useLogger(app.get(Logger));
    if (entrypoint.globalPrefix !== null) {
      app.setGlobalPrefix(entrypoint.globalPrefix, { exclude: [...UNPREFIXED_ROUTES] });
    }
    return app;
  }

  async start(): Promise<INestApplication> {
    const app = await this.create();
    app.enableShutdownHooks();
    await app.listen(this.config.http.port, this.config.http.host);
    app.get(Logger).log({
      msg: LogMessage.Listening,
      host: this.config.http.host,
      port: this.config.http.port,
    });
    return app;
  }
}
