import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
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
}
