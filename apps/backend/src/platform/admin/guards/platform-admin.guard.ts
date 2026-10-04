import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { PlatformAdminRequiredError } from '@/platform/admin/errors/platform-admin-required.error';
import { PlatformAdminAuthorizerService } from '@/platform/admin/services/platform-admin-authorizer.service';
import { ConfigService } from '@/platform/config/services/config.service';
import { UseCaseCtxService } from '@/platform/context/services/use-case-ctx.service';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';
import { Role } from '@/platform/module-roles/constants/role.constants';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly contexts: UseCaseCtxService,
    private readonly authorizer: PlatformAdminAuthorizerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { config } = this.config;
    if (config.role === Role.Api && config.platformAdmin.devAccess) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    if (this.arrivedThroughAdminRoute(request)) {
      return true;
    }
    const actor = await this.contexts.resolveActor(
      request.header(HttpHeader.Authorization) ?? null,
    );
    if (!(await this.authorizer.isPlatformAdmin(actor))) {
      throw new PlatformAdminRequiredError();
    }
    return true;
  }

  private arrivedThroughAdminRoute(request: Request): boolean {
    return (request.header(HttpHeader.PlatformAdminRoute) ?? '') !== '';
  }
}
