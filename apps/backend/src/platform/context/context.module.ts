import { Global, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { Authenticator } from '@/platform/context/authenticator';
import { DenyAllAuthenticator } from '@/platform/context/deny-all.authenticator';
import { TraceIdService } from '@/platform/context/trace-id.service';
import { UseCaseCtxFactory } from '@/platform/context/use-case-ctx.factory';
import { resolveTraceId } from '@/platform/observability/tracing/tracing.helpers';

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
