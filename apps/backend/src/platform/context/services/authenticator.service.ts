import type { Actor } from '@/platform/context/typedefs/actor.typedefs';

export abstract class AuthenticatorService {
  abstract authenticate(token: string): Promise<Actor>;
}
