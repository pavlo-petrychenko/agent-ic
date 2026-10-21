import type { LlmKeyVendor } from '@agent-ic/contracts';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import { llmKeys } from '@/modules/llm-keys/db/llm-keys.table';
import { llmKeyNamesLockKey } from '@/modules/llm-keys/helpers/llm-key.helpers';
import type { LlmKey, NewLlmKey } from '@/modules/llm-keys/typedefs/llm-key.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class LlmKeysRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insert(key: NewLlmKey): Promise<void> {
    await this.txHost.tx.insert(llmKeys).values(key);
  }

  async lockNames(workspaceId: string): Promise<void> {
    await this.txHost.tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${llmKeyNamesLockKey(workspaceId)}))`,
    );
  }

  async findById(workspaceId: string, keyId: string): Promise<LlmKey | null> {
    const [key] = await this.txHost.tx
      .select()
      .from(llmKeys)
      .where(and(eq(llmKeys.workspaceId, workspaceId), eq(llmKeys.id, keyId)));
    return key ?? null;
  }

  async findByVendor(workspaceId: string, vendor: LlmKeyVendor): Promise<LlmKey | null> {
    const [key] = await this.txHost.tx
      .select()
      .from(llmKeys)
      .where(and(eq(llmKeys.workspaceId, workspaceId), eq(llmKeys.vendor, vendor)))
      .limit(1);
    return key ?? null;
  }

  async findByName(workspaceId: string, name: string): Promise<LlmKey | null> {
    const [key] = await this.txHost.tx
      .select()
      .from(llmKeys)
      .where(
        and(eq(llmKeys.workspaceId, workspaceId), sql`lower(${llmKeys.name}) = lower(${name})`),
      );
    return key ?? null;
  }

  listByWorkspace(workspaceId: string): Promise<LlmKey[]> {
    return this.txHost.tx
      .select()
      .from(llmKeys)
      .where(eq(llmKeys.workspaceId, workspaceId))
      .orderBy(asc(llmKeys.createdAt), asc(llmKeys.id));
  }

  async setFallback(
    workspaceId: string,
    keyId: string,
    fallbackToPlatform: boolean,
    updatedAt: Date,
  ): Promise<LlmKey | null> {
    const [key] = await this.txHost.tx
      .update(llmKeys)
      .set({ fallbackToPlatform, updatedAt })
      .where(and(eq(llmKeys.workspaceId, workspaceId), eq(llmKeys.id, keyId)))
      .returning();
    return key ?? null;
  }

  async deleteById(workspaceId: string, keyId: string): Promise<boolean> {
    const deleted = await this.txHost.tx
      .delete(llmKeys)
      .where(and(eq(llmKeys.workspaceId, workspaceId), eq(llmKeys.id, keyId)))
      .returning({ id: llmKeys.id });
    return deleted.length > 0;
  }

  async deleteByWorkspace(workspaceId: string): Promise<void> {
    await this.txHost.tx.delete(llmKeys).where(eq(llmKeys.workspaceId, workspaceId));
  }
}
