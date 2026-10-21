import { Injectable } from '@nestjs/common';
import {
  EMAIL_CHANGE_TTL_SECONDS,
  EmailTokenPurpose,
} from '@/modules/identity/constants/identity.constants';
import { TokenExpiredError } from '@/modules/identity/errors/token-expired.error';
import { TokenInvalidError } from '@/modules/identity/errors/token-invalid.error';
import { addSeconds, isPast } from '@/modules/identity/helpers/time.helpers';
import { EmailTokensRepository } from '@/modules/identity/repositories/email-tokens.repository';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import type {
  EmailTokenRecord,
  IssuedEmailChange,
} from '@/modules/identity/typedefs/email-token.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class EmailChangesService {
  constructor(
    private readonly users: UsersRepository,
    private readonly emailTokens: EmailTokensRepository,
    private readonly secureTokens: SecureTokenService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async issueChangeToken(userId: string): Promise<IssuedEmailChange | null> {
    const user = await this.users.findById(userId);
    const email = user?.pendingEmail ?? null;
    if (user === null || email === null || email === user.email) {
      return null;
    }
    const taken = await this.users.findByEmail(email);
    if (taken !== null && taken.id !== userId) {
      return null;
    }
    const now = this.clock.now();
    await this.emailTokens.invalidateOpen(userId, EmailTokenPurpose.EmailChange, now);
    const { token, hash } = this.secureTokens.generate();
    await this.emailTokens.insert({
      id: this.ids.generate(),
      userId,
      purpose: EmailTokenPurpose.EmailChange,
      tokenHash: hash,
      expiresAt: addSeconds(now, EMAIL_CHANGE_TTL_SECONDS),
    });
    return { token, email, name: user.name, locale: user.locale };
  }

  async requireUsable(token: string): Promise<EmailTokenRecord> {
    const record = await this.emailTokens.findByTokenHash(
      this.secureTokens.hash(token),
      EmailTokenPurpose.EmailChange,
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
