import type { Actor } from './context.typedefs';

export abstract class Authenticator {
  abstract authenticate(token: string): Promise<Actor>;
}
