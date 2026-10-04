import { PlatformAdminGuard } from '@/platform/admin/guards/platform-admin.guard';
import { NoPlatformAdminsAuthorizerService } from '@/platform/admin/services/no-platform-admins-authorizer.service';
import { PlatformAdminAuthorizerService } from '@/platform/admin/services/platform-admin-authorizer.service';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class AdminModule extends defineModule({
  global: true,
  providers: [
    { provide: PlatformAdminAuthorizerService, useClass: NoPlatformAdminsAuthorizerService },
    PlatformAdminGuard,
  ],
  exports: [PlatformAdminAuthorizerService, PlatformAdminGuard],
}) {}
