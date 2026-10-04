import type { Actor } from '@/platform/context/typedefs/actor.typedefs';

export abstract class PlatformAdminAuthorizer {
  abstract isPlatformAdmin(actor: Actor): Promise<boolean>;
}
