import { Injectable } from '@nestjs/common';
import { PlatformAdminAuthorizerService } from '@/platform/admin/services/platform-admin-authorizer.service';

@Injectable()
export class NoPlatformAdminsAuthorizerService extends PlatformAdminAuthorizerService {
  isPlatformAdmin(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
