import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { ClsService } from 'nestjs-cls';
import { USE_CASE_CTX_CLS_KEY } from '@/platform/context/constants/authentication.constants';
import { transportRequestFromHttp } from '@/platform/context/helpers/transport-request.helpers';
import { TraceIdService } from '@/platform/context/services/trace-id.service';
import { UseCaseCtxService } from '@/platform/context/services/use-case-ctx.service';

@Injectable()
export class UseCaseCtxGuard implements CanActivate {
  constructor(
    private readonly contexts: UseCaseCtxService,
    private readonly traceIds: TraceIdService,
    private readonly cls: ClsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ctx = await this.contexts.create(
      transportRequestFromHttp(request, this.traceIds.current()),
    );
    this.cls.set(USE_CASE_CTX_CLS_KEY, ctx);
    return true;
  }
}
