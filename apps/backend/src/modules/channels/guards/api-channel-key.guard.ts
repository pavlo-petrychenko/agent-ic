import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { ClsService } from 'nestjs-cls';
import { API_CHANNEL_ID_PARAM } from '@/modules/channels/constants/api-channel.constants';
import { ApiChannelKeyVerifierService } from '@/modules/channels/services/api-channel-key-verifier.service';
import { USE_CASE_CTX_CLS_KEY } from '@/platform/context/constants/authentication.constants';
import { TraceIdService } from '@/platform/context/services/trace-id.service';

@Injectable()
export class ApiChannelKeyGuard implements CanActivate {
  constructor(
    private readonly verifier: ApiChannelKeyVerifierService,
    private readonly traceIds: TraceIdService,
    private readonly cls: ClsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const result = await this.verifier.verify({
      publicChannelId: String(request.params[API_CHANNEL_ID_PARAM] ?? ''),
      authorization: request.headers.authorization ?? null,
      traceId: this.traceIds.current(),
      clientIp: request.ip ?? null,
    });
    this.cls.set(USE_CASE_CTX_CLS_KEY, result.ctx);
    return true;
  }
}
