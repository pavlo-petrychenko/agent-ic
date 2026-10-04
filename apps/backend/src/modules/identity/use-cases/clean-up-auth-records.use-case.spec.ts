import { randomUUID } from 'node:crypto';
import { TransactionHost } from '@nestjs-cls/transactional';
import { inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SPENT_EMAIL_TOKEN_RETENTION_SECONDS } from '@/modules/identity/constants/identity-job.constants';
import {
  EmailTokenPurpose,
  SECONDS_PER_DAY,
} from '@/modules/identity/constants/identity.constants';
import { emailTokens } from '@/modules/identity/db/email-tokens.table';
import { sessions } from '@/modules/identity/db/sessions.table';
import { addSeconds } from '@/modules/identity/helpers/time.helpers';
import type { NewEmailToken } from '@/modules/identity/typedefs/email-token.typedefs';
import type { NewSession } from '@/modules/identity/typedefs/session.typedefs';
import { CleanUpAuthRecordsUseCase } from '@/modules/identity/use-cases/clean-up-auth-records.use-case';
import { SystemActorRequiredError } from '@/platform/context/errors/system-actor-required.error';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';
import { anonymousCtx, systemCtx } from '@test/support/fixtures/identity.fixture';
import {
  createIdentityTestbed,
  signUpAccount,
} from '@test/support/helpers/identity-testing.helpers';
import { TestTransactionService } from '@test/support/services/test-transaction.service';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

const DAY = SECONDS_PER_DAY;
const PAST_RETENTION = -(SPENT_EMAIL_TOKEN_RETENTION_SECONDS + DAY);

describe('CleanUpAuthRecordsUseCase', () => {
  let testbed: IdentityTestbed;
  let txHost: TransactionHost<AppTransactionAdapter>;
  let transactions: TestTransactionService;
  let cleanUp: CleanUpAuthRecordsUseCase;
  let userId: string;

  const at = (seconds: number): Date => addSeconds(testbed.clock.now(), seconds);

  const token = (overrides: Partial<NewEmailToken>): NewEmailToken => ({
    id: randomUUID(),
    userId,
    purpose: EmailTokenPurpose.EmailConfirmation,
    tokenHash: randomUUID(),
    expiresAt: at(DAY),
    usedAt: null,
    createdAt: at(-DAY),
    ...overrides,
  });

  const session = (overrides: Partial<NewSession>): NewSession => ({
    id: randomUUID(),
    userId,
    familyId: randomUUID(),
    tokenHash: randomUUID(),
    replacedById: null,
    expiresAt: at(DAY),
    revokedAt: null,
    createdAt: at(-DAY),
    ...overrides,
  });

  const remainingTokenIds = async (ids: string[]): Promise<string[]> => {
    const rows = await txHost.tx
      .select({ id: emailTokens.id })
      .from(emailTokens)
      .where(inArray(emailTokens.id, ids));
    return rows.map((row) => row.id).toSorted();
  };

  const remainingSessionIds = async (ids: string[]): Promise<string[]> => {
    const rows = await txHost.tx
      .select({ id: sessions.id })
      .from(sessions)
      .where(inArray(sessions.id, ids));
    return rows.map((row) => row.id).toSorted();
  };

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    txHost = testbed.module.get(TransactionHost);
    transactions = new TestTransactionService(txHost);
    cleanUp = testbed.module.get(CleanUpAuthRecordsUseCase);
    userId = (await signUpAccount(testbed)).userId;
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('deletes email tokens used or expired before the retention and keeps the rest', async () => {
    const usedLongAgo = token({ usedAt: at(PAST_RETENTION) });
    const expiredLongAgo = token({ expiresAt: at(PAST_RETENTION) });
    const usedRecently = token({ usedAt: at(-DAY) });
    const expiredRecently = token({ expiresAt: at(-DAY) });
    const open = token({});
    const all = [usedLongAgo, expiredLongAgo, usedRecently, expiredRecently, open];

    await transactions.rollback(async () => {
      await txHost.tx.insert(emailTokens).values(all);

      await cleanUp.execute(systemCtx());

      expect(await remainingTokenIds(all.map((row) => row.id))).toEqual(
        [usedRecently.id, expiredRecently.id, open.id].toSorted(),
      );
    });
  });

  it('deletes expired and revoked sessions and keeps live ones', async () => {
    const live = session({});
    const expired = session({ expiresAt: at(-1) });
    const revoked = session({ revokedAt: at(-1) });
    const all = [live, expired, revoked];

    await transactions.rollback(async () => {
      await txHost.tx.insert(sessions).values(all);

      await cleanUp.execute(systemCtx());

      expect(await remainingSessionIds(all.map((row) => row.id))).toEqual([live.id]);
    });
  });

  it('deletes an ended rotation chain and keeps a session a live one still points to', async () => {
    const familyId = randomUUID();
    const replacement = session({ familyId, revokedAt: at(-1) });
    const replaced = session({ familyId, expiresAt: at(-DAY), replacedById: replacement.id });
    const pointedTo = session({ revokedAt: at(-1) });
    const livePointer = session({ replacedById: pointedTo.id });
    const all = [replacement, replaced, pointedTo, livePointer];

    await transactions.rollback(async () => {
      await txHost.tx.insert(sessions).values(all);

      await cleanUp.execute(systemCtx());

      expect(await remainingSessionIds(all.map((row) => row.id))).toEqual(
        [pointedTo.id, livePointer.id].toSorted(),
      );
    });
  });

  it('runs only as the system actor', async () => {
    await expect(cleanUp.execute(anonymousCtx())).rejects.toBeInstanceOf(SystemActorRequiredError);
  });
});
