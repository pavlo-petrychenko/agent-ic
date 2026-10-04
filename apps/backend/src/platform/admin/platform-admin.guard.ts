import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { PlatformAdminRequiredError } from '@/platform/admin/platform-admin-required.error';
import { PlatformAdminAuthorizer } from '@/platform/admin/platform-admin.authorizer';
import { Role } from '@/platform/config/config.constants';
import { ConfigService } from '@/platform/config/config.service';
import { UseCaseCtxFactory } from '@/platform/context/use-case-ctx.factory';
import { HttpHeader } from '@/platform/http/http.constants';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly contexts: UseCaseCtxFactory,
    private readonly authorizer: PlatformAdminAuthorizer,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { config } = this.config;
    if (config.role === Role.Api && config.platformAdmin.devAccess) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    const actor = await this.contexts.resolveActor(
      request.header(HttpHeader.Authorization) ?? null,
    );
    if (!(await this.authorizer.isPlatformAdmin(actor))) {
      throw new PlatformAdminRequiredError();
    }
    return true;
  }
}
