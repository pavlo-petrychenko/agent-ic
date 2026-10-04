import { Injectable } from '@nestjs/common';
import { Authenticator } from '@/platform/context/authenticator';
import type { Actor } from '@/platform/context/context.typedefs';
import { InvalidAccessTokenError } from '@/platform/context/invalid-access-token.error';

@Injectable()
export class DenyAllAuthenticator extends Authenticator {
  authenticate(): Promise<Actor> {
    return Promise.reject(new InvalidAccessTokenError());
  }
}
