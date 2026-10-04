import { Global, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { AuthenticatorService } from '@/platform/context/services/authenticator.service';
import { DenyAllAuthenticatorService } from '@/platform/context/services/deny-all-authenticator.service';
import { TraceIdService } from '@/platform/context/services/trace-id.service';
import { UseCaseCtxService } from '@/platform/context/services/use-case-ctx.service';
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
    { provide: AuthenticatorService, useClass: DenyAllAuthenticatorService },
    TraceIdService,
    UseCaseCtxService,
  ],
  exports: [TraceIdService, UseCaseCtxService],
})
export class ContextModule {}
