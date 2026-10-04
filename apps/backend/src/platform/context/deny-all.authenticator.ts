import { Injectable } from '@nestjs/common';

import { Authenticator } from './authenticator';
import type { Actor } from './context.typedefs';
import { InvalidAccessTokenError } from './invalid-access-token.error';

@Injectable()
export class DenyAllAuthenticator extends Authenticator {
  authenticate(): Promise<Actor> {
    return Promise.reject(new InvalidAccessTokenError());
  }
}
