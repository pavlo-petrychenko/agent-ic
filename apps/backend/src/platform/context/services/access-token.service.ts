import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { jwtVerify, SignJWT } from 'jose';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { ClockService } from '@/platform/clock/services/clock.service';
import { ConfigService } from '@/platform/config/services/config.service';
import {
  ACCESS_TOKEN_ALGORITHM,
  ACCESS_TOKEN_AUDIENCE,
  ACCESS_TOKEN_ISSUER,
  ACCESS_TOKEN_TTL_SECONDS,
} from '@/platform/context/constants/access-token.constants';
import { InvalidAccessTokenError } from '@/platform/context/errors/invalid-access-token.error';
import { accessTokenPayloadSchema } from '@/platform/context/schemas/access-token.schema';
import type {
  AccessTokenClaims,
  IssuedAccessToken,
} from '@/platform/context/typedefs/access-token.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class AccessTokenService {
  private readonly key: Uint8Array;

  constructor(
    config: ConfigService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {
    this.key = new TextEncoder().encode(config.config.auth.accessTokenSecret);
  }

  async issue(claims: AccessTokenClaims): Promise<IssuedAccessToken> {
    const issuedAt = Math.floor(this.clock.now().getTime() / MILLISECONDS_PER_SECOND);
    const expiresAt = issuedAt + ACCESS_TOKEN_TTL_SECONDS;
    const token = await new SignJWT({ sid: this.ids.toPublic(IdPrefix.Session, claims.sessionId) })
      .setProtectedHeader({ alg: ACCESS_TOKEN_ALGORITHM })
      .setSubject(this.ids.toPublic(IdPrefix.User, claims.userId))
      .setIssuer(ACCESS_TOKEN_ISSUER)
      .setAudience(ACCESS_TOKEN_AUDIENCE)
      .setIssuedAt(issuedAt)
      .setExpirationTime(expiresAt)
      .sign(this.key);
    return { token, expiresAt: new Date(expiresAt * MILLISECONDS_PER_SECOND) };
  }

  async verify(token: string): Promise<AccessTokenClaims> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        algorithms: [ACCESS_TOKEN_ALGORITHM],
        issuer: ACCESS_TOKEN_ISSUER,
        audience: ACCESS_TOKEN_AUDIENCE,
        currentDate: this.clock.now(),
      });
      const claims = accessTokenPayloadSchema.parse(payload);
      return {
        userId: this.ids.fromPublic(IdPrefix.User, claims.sub),
        sessionId: this.ids.fromPublic(IdPrefix.Session, claims.sid),
      };
    } catch (error) {
      throw new InvalidAccessTokenError(error);
    }
  }
}
