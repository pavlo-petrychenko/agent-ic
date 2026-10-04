import { Injectable } from '@nestjs/common';
import { REFRESH_TOKEN_TTL_SECONDS } from '@/modules/identity/constants/identity.constants';
import { addSeconds } from '@/modules/identity/helpers/time.helpers';
import { SessionsRepository } from '@/modules/identity/repositories/sessions.repository';
import type {
  CreatedSession,
  IssuedSession,
  SessionRecord,
} from '@/modules/identity/typedefs/session.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { AccessTokenService } from '@/platform/context/services/access-token.service';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class SessionsService {
  constructor(
    private readonly sessions: SessionsRepository,
    private readonly accessTokens: AccessTokenService,
    private readonly secureTokens: SecureTokenService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async start(userId: string): Promise<IssuedSession> {
    const created = await this.create(userId, this.ids.generate());
    return created.issued;
  }

  async rotate(current: SessionRecord): Promise<IssuedSession> {
    const next = await this.create(current.userId, current.familyId);
    await this.sessions.markReplaced(current.id, next.sessionId);
    return next.issued;
  }

  findByRefreshToken(refreshToken: string): Promise<SessionRecord | null> {
    return this.sessions.findByTokenHashForUpdate(this.secureTokens.hash(refreshToken));
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.sessions.revokeFamily(familyId, this.clock.now());
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.sessions.revokeAllForUser(userId, this.clock.now());
  }

  private async create(userId: string, familyId: string): Promise<CreatedSession> {
    const now = this.clock.now();
    const sessionId = this.ids.generate();
    const refresh = this.secureTokens.generate();
    const refreshTokenExpiresAt = addSeconds(now, REFRESH_TOKEN_TTL_SECONDS);
    await this.sessions.insert({
      id: sessionId,
      userId,
      familyId,
      tokenHash: refresh.hash,
      expiresAt: refreshTokenExpiresAt,
      createdAt: now,
    });
    const access = await this.accessTokens.issue({ userId, sessionId });
    return {
      sessionId,
      issued: {
        userId,
        accessToken: access.token,
        accessTokenExpiresAt: access.expiresAt,
        refreshToken: refresh.token,
        refreshTokenExpiresAt,
      },
    };
  }
}
