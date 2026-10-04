import { Injectable } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import { TracingService } from '@/platform/observability/tracing/tracing.service';

@Injectable()
export class TracingLifecycle implements OnApplicationShutdown {
  constructor(private readonly tracing: TracingService) {}

  async onApplicationShutdown(): Promise<void> {
    await this.tracing.shutdown();
  }
}
