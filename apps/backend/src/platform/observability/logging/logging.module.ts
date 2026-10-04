import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { ConfigService } from '@/platform/config/config.service';

import { createLoggerParams } from './logging.helpers';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createLoggerParams(config.config),
    }),
  ],
})
export class LoggingModule {}
