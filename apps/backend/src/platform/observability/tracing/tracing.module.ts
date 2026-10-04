import { Module } from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';
import { TracingLifecycle } from '@/platform/observability/tracing/tracing.lifecycle';
import { TracingService } from '@/platform/observability/tracing/tracing.service';

@Module({})
export class TracingModule {
  static register(tracing: TracingService): DynamicModule {
    return {
      module: TracingModule,
      providers: [{ provide: TracingService, useValue: tracing }, TracingLifecycle],
    };
  }
}
