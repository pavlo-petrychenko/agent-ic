import type { Actor } from '@/platform/context/typedefs/actor.typedefs';

export abstract class PlatformAdminAuthorizerService {
  abstract isPlatformAdmin(actor: Actor): Promise<boolean>;
}
