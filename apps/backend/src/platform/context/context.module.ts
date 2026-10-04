import { Global, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { UseCaseCtxGuard } from '@/platform/context/guards/use-case-ctx.guard';
import { AccessTokenAuthenticatorService } from '@/platform/context/services/access-token-authenticator.service';
import { AccessTokenService } from '@/platform/context/services/access-token.service';
import { AuthenticatorService } from '@/platform/context/services/authenticator.service';
import { TraceIdService } from '@/platform/context/services/trace-id.service';
import { UseCaseCtxService } from '@/platform/context/services/use-case-ctx.service';
import { resolveTraceId } from '@/platform/observability/helpers/tracing.helpers';

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true, generateId: true, idGenerator: resolveTraceId },
    }),
  ],
  providers: [
    AccessTokenService,
    { provide: AuthenticatorService, useClass: AccessTokenAuthenticatorService },
    TraceIdService,
    UseCaseCtxService,
    UseCaseCtxGuard,
  ],
  exports: [AccessTokenService, TraceIdService, UseCaseCtxService, UseCaseCtxGuard],
})
export class ContextModule {}
