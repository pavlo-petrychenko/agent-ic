import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq, isNotNull, isNull, lte, not, notExists, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { REPLACING_SESSION_ALIAS } from '@/modules/identity/constants/session.constants';
import { sessions } from '@/modules/identity/db/sessions.table';
import type { NewSession, SessionRecord } from '@/modules/identity/typedefs/session.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class SessionsRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insert(session: NewSession): Promise<void> {
    await this.txHost.tx.insert(sessions).values(session);
  }

  async findByTokenHashForUpdate(tokenHash: string): Promise<SessionRecord | null> {
    const [session] = await this.txHost.tx
      .select()
      .from(sessions)
      .where(eq(sessions.tokenHash, tokenHash))
      .for('update');
    return session ?? null;
  }

  async markReplaced(id: string, replacedById: string): Promise<void> {
    await this.txHost.tx.update(sessions).set({ replacedById }).where(eq(sessions.id, id));
  }

  async revokeFamily(familyId: string, at: Date): Promise<void> {
    await this.txHost.tx
      .update(sessions)
      .set({ revokedAt: at })
      .where(and(eq(sessions.familyId, familyId), isNull(sessions.revokedAt)));
  }

  async revokeAllForUser(userId: string, at: Date): Promise<void> {
    await this.txHost.tx
      .update(sessions)
      .set({ revokedAt: at })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  }

  async deleteEnded(now: Date): Promise<void> {
    const replacing = alias(sessions, REPLACING_SESSION_ALIAS);
    await this.txHost.tx.delete(sessions).where(
      and(
        this.isEnded(sessions.expiresAt, sessions.revokedAt, now),
        notExists(
          this.txHost.tx
            .select({ id: replacing.id })
            .from(replacing)
            .where(
              and(
                eq(replacing.replacedById, sessions.id),
                not(this.isEnded(replacing.expiresAt, replacing.revokedAt, now)),
              ),
            ),
        ),
      ),
    );
  }

  private isEnded(expiresAt: PgColumn, revokedAt: PgColumn, now: Date): SQL {
    return sql`(${lte(expiresAt, now)} or ${isNotNull(revokedAt)})`;
  }
}
