import { Injectable } from '@nestjs/common';

import { PlatformAdminAuthorizer } from './platform-admin.authorizer';

@Injectable()
export class NoPlatformAdminsAuthorizer extends PlatformAdminAuthorizer {
  isPlatformAdmin(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
