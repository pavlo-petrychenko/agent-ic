import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { RefreshOutcomeKind } from '@/modules/identity/constants/session.constants';
import { InvalidRefreshTokenError } from '@/modules/identity/errors/invalid-refresh-token.error';
import { isPast } from '@/modules/identity/helpers/time.helpers';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { SessionsService } from '@/modules/identity/services/sessions.service';
import type { RefreshTokenInput } from '@/modules/identity/typedefs/account.typedefs';
import type { IssuedSession, RefreshOutcome } from '@/modules/identity/typedefs/session.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class RefreshSessionUseCase {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly sessions: SessionsService,
    private readonly users: UsersRepository,
    private readonly clock: ClockService,
  ) {}

  async execute(_ctx: UseCaseCtx, input: RefreshTokenInput): Promise<IssuedSession> {
    const { refreshToken } = input;
    if (refreshToken === null || refreshToken === '') {
      throw new InvalidRefreshTokenError();
    }
    const outcome = await this.txHost.withTransaction(() => this.refresh(refreshToken));
    if (outcome.kind !== RefreshOutcomeKind.Rotated) {
      throw new InvalidRefreshTokenError();
    }
    return outcome.session;
  }

  private async refresh(refreshToken: string): Promise<RefreshOutcome> {
    const now = this.clock.now();
    const current = await this.sessions.findByRefreshToken(refreshToken);
    if (current === null) {
      return { kind: RefreshOutcomeKind.Invalid };
    }
    if (current.replacedById !== null) {
      await this.sessions.revokeFamily(current.familyId);
      return { kind: RefreshOutcomeKind.Reused };
    }
    if (current.revokedAt !== null || isPast(current.expiresAt, now)) {
      return { kind: RefreshOutcomeKind.Invalid };
    }
    await this.users.touchLastActive(current.userId, now);
    return { kind: RefreshOutcomeKind.Rotated, session: await this.sessions.rotate(current) };
  }
}
