import { Injectable } from '@nestjs/common';
import {
  EmailTokenPurpose,
  PASSWORD_RESET_TTL_SECONDS,
} from '@/modules/identity/constants/identity.constants';
import { TokenExpiredError } from '@/modules/identity/errors/token-expired.error';
import { TokenInvalidError } from '@/modules/identity/errors/token-invalid.error';
import { addSeconds, isPast } from '@/modules/identity/helpers/time.helpers';
import { EmailTokensRepository } from '@/modules/identity/repositories/email-tokens.repository';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import type {
  EmailTokenRecord,
  IssuedPasswordReset,
} from '@/modules/identity/typedefs/email-token.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class PasswordResetsService {
  constructor(
    private readonly users: UsersRepository,
    private readonly emailTokens: EmailTokensRepository,
    private readonly secureTokens: SecureTokenService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async issueResetToken(userId: string): Promise<IssuedPasswordReset | null> {
    const user = await this.users.findById(userId);
    if (user === null || user.emailConfirmedAt === null) {
      return null;
    }
    const now = this.clock.now();
    await this.emailTokens.invalidateOpen(userId, EmailTokenPurpose.PasswordReset, now);
    const { token, hash } = this.secureTokens.generate();
    await this.emailTokens.insert({
      id: this.ids.generate(),
      userId,
      purpose: EmailTokenPurpose.PasswordReset,
      tokenHash: hash,
      expiresAt: addSeconds(now, PASSWORD_RESET_TTL_SECONDS),
      createdAt: now,
    });
    return { token, email: user.email, name: user.name, locale: user.locale };
  }

  async requireUsable(token: string): Promise<EmailTokenRecord> {
    const record = await this.emailTokens.findByTokenHash(
      this.secureTokens.hash(token),
      EmailTokenPurpose.PasswordReset,
    );
    if (record === null || record.usedAt !== null) {
      throw new TokenInvalidError();
    }
    if (isPast(record.expiresAt, this.clock.now())) {
      throw new TokenExpiredError();
    }
    return record;
  }

  async consume(token: string): Promise<EmailTokenRecord> {
    const record = await this.requireUsable(token);
    if (!(await this.emailTokens.markUsed(record.id, this.clock.now()))) {
      throw new TokenInvalidError();
    }
    return record;
  }
}
