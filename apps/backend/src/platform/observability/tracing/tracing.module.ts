import { Module } from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';

import { TracingLifecycle } from './tracing.lifecycle';
import { TracingService } from './tracing.service';

@Module({})
export class TracingModule {
  static register(tracing: TracingService): DynamicModule {
    return {
      module: TracingModule,
      providers: [{ provide: TracingService, useValue: tracing }, TracingLifecycle],
    };
  }
}
