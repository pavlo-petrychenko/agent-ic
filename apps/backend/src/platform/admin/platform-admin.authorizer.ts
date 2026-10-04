import type { Actor } from '@/platform/context/context.typedefs';

export abstract class PlatformAdminAuthorizer {
  abstract isPlatformAdmin(actor: Actor): Promise<boolean>;
}
