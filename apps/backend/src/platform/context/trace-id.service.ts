import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { resolveTraceId } from '@/platform/observability/helpers/tracing.helpers';

@Injectable()
export class TraceIdService {
  constructor(private readonly cls: ClsService) {}

  current(): string {
    const requestId: string | undefined = this.cls.isActive() ? this.cls.getId() : undefined;
    return requestId ?? resolveTraceId();
  }
}
