import { Injectable } from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';
import { LOG_CONTEXT_CLS_KEY } from '@/platform/observability/constants/logger.constants';
import type { LogContextFields } from '@/platform/observability/typedefs/log-context.typedefs';

@Injectable()
export class LogContextService {
  private readonly cls = ClsServiceManager.getClsService();

  assign(fields: LogContextFields): void {
    if (this.cls.isActive()) {
      this.cls.set(LOG_CONTEXT_CLS_KEY, { ...this.fields(), ...fields });
    }
  }

  fields(): LogContextFields {
    return this.cls.isActive()
      ? (this.cls.get<LogContextFields | undefined>(LOG_CONTEXT_CLS_KEY) ?? {})
      : {};
  }

  requestId(): string | undefined {
    return this.cls.isActive() ? this.cls.getId() : undefined;
  }
}
