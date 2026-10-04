import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { PlatformAdminRequiredError } from '@/platform/admin/platform-admin-required.error';
import { PlatformAdminAuthorizer } from '@/platform/admin/platform-admin.authorizer';
import { ConfigService } from '@/platform/config/services/config.service';
import { UseCaseCtxService } from '@/platform/context/services/use-case-ctx.service';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';
import { Role } from '@/platform/module-roles/constants/role.constants';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly contexts: UseCaseCtxService,
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
