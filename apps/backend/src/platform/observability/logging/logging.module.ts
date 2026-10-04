import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigService } from '@/platform/config/services/config.service';
import { createLoggerParams } from '@/platform/observability/logging/logging.helpers';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createLoggerParams(config.config),
    }),
  ],
})
export class LoggingModule {}
