import { Global, Module } from '@nestjs/common';
import { NoPlatformAdminsAuthorizer } from '@/platform/admin/no-platform-admins.authorizer';
import { PlatformAdminAuthorizer } from '@/platform/admin/platform-admin.authorizer';
import { PlatformAdminGuard } from '@/platform/admin/platform-admin.guard';

@Global()
@Module({
  providers: [
    { provide: PlatformAdminAuthorizer, useClass: NoPlatformAdminsAuthorizer },
    PlatformAdminGuard,
  ],
  exports: [PlatformAdminAuthorizer, PlatformAdminGuard],
})
export class AdminModule {}
