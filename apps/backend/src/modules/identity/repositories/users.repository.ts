import type { Locale } from '@agent-ic/contracts';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { users } from '@/modules/identity/db/users.table';
import type { NewUser, UserName, UserRecord } from '@/modules/identity/typedefs/user.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class UsersRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly clock: ClockService,
  ) {}

  async upsertUnconfirmed(user: NewUser): Promise<UserRecord | null> {
    const now = this.clock.now();
    const [saved] = await this.txHost.tx
      .insert(users)
      .values({ ...user, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          name: user.name,
          passwordHash: user.passwordHash,
          locale: user.locale,
          pendingInviteLinkId: user.pendingInviteLinkId ?? null,
          confirmationBindingHash: user.confirmationBindingHash ?? null,
          updatedAt: now,
        },
        setWhere: isNull(users.emailConfirmedAt),
      })
      .returning();
    return saved ?? null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const [user] = await this.txHost.tx.select().from(users).where(eq(users.id, id));
    return user ?? null;
  }

  async findNames(ids: readonly string[]): Promise<UserName[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.txHost.tx
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(inArray(users.id, [...ids]));
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const [user] = await this.txHost.tx.select().from(users).where(eq(users.email, email));
    return user ?? null;
  }

  async findByEmailForShare(email: string): Promise<UserRecord | null> {
    const [user] = await this.txHost.tx
      .select()
      .from(users)
      .where(eq(users.email, email))
      .for('share');
    return user ?? null;
  }

  async markEmailConfirmed(id: string, at: Date): Promise<void> {
    await this.txHost.tx
      .update(users)
      .set({ emailConfirmedAt: at, confirmationBindingHash: null, updatedAt: this.clock.now() })
      .where(and(eq(users.id, id), isNull(users.emailConfirmedAt)));
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.txHost.tx
      .update(users)
      .set({ passwordHash, updatedAt: this.clock.now() })
      .where(eq(users.id, id));
  }

  async updateLocale(id: string, locale: Locale): Promise<UserRecord | null> {
    const [user] = await this.txHost.tx
      .update(users)
      .set({ locale, updatedAt: this.clock.now() })
      .where(eq(users.id, id))
      .returning();
    return user ?? null;
  }

  async updateLastWorkspace(id: string, workspaceId: string): Promise<UserRecord | null> {
    const [user] = await this.txHost.tx
      .update(users)
      .set({ lastWorkspaceId: workspaceId, updatedAt: this.clock.now() })
      .where(eq(users.id, id))
      .returning();
    return user ?? null;
  }

  async touchLastActive(id: string, at: Date): Promise<void> {
    await this.txHost.tx
      .update(users)
      .set({ lastActiveAt: at, updatedAt: this.clock.now() })
      .where(eq(users.id, id));
  }

  async clearPendingInvite(id: string): Promise<void> {
    await this.txHost.tx
      .update(users)
      .set({ pendingInviteLinkId: null, updatedAt: this.clock.now() })
      .where(eq(users.id, id));
  }

  async updateName(id: string, name: string): Promise<UserRecord | null> {
    const [user] = await this.txHost.tx
      .update(users)
      .set({ name, updatedAt: this.clock.now() })
      .where(eq(users.id, id))
      .returning();
    return user ?? null;
  }

  async updateEmail(id: string, email: string, confirmedAt: Date): Promise<UserRecord | null> {
    const [user] = await this.txHost.tx
      .update(users)
      .set({
        email,
        pendingEmail: null,
        emailConfirmedAt: confirmedAt,
        updatedAt: this.clock.now(),
      })
      .where(eq(users.id, id))
      .returning();
    return user ?? null;
  }

  async setPendingEmail(id: string, email: string | null): Promise<void> {
    await this.txHost.tx
      .update(users)
      .set({ pendingEmail: email, updatedAt: this.clock.now() })
      .where(eq(users.id, id));
  }
}
