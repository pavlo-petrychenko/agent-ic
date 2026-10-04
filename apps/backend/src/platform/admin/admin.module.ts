import { Global, Module } from '@nestjs/common';

import { NoPlatformAdminsAuthorizer } from './no-platform-admins.authorizer';
import { PlatformAdminAuthorizer } from './platform-admin.authorizer';
import { PlatformAdminGuard } from './platform-admin.guard';

@Global()
@Module({
  providers: [
    { provide: PlatformAdminAuthorizer, useClass: NoPlatformAdminsAuthorizer },
    PlatformAdminGuard,
  ],
  exports: [PlatformAdminAuthorizer, PlatformAdminGuard],
})
export class AdminModule {}
