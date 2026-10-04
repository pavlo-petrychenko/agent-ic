import { Global, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';

import { resolveTraceId } from '@/platform/observability/tracing/tracing.helpers';

import { Authenticator } from './authenticator';
import { DenyAllAuthenticator } from './deny-all.authenticator';
import { TraceIdService } from './trace-id.service';
import { UseCaseCtxFactory } from './use-case-ctx.factory';

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true, generateId: true, idGenerator: resolveTraceId },
    }),
  ],
  providers: [
    { provide: Authenticator, useClass: DenyAllAuthenticator },
    TraceIdService,
    UseCaseCtxFactory,
  ],
  exports: [TraceIdService, UseCaseCtxFactory],
})
export class ContextModule {}
