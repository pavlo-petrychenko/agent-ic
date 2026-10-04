import type { Actor } from '@/platform/context/context.typedefs';

export abstract class Authenticator {
  abstract authenticate(token: string): Promise<Actor>;
}
