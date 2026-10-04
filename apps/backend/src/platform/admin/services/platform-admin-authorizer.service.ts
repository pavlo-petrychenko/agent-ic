import type { Actor } from '@/platform/context/context.typedefs';

export abstract class PlatformAdminAuthorizerService {
  abstract isPlatformAdmin(actor: Actor): Promise<boolean>;
}
