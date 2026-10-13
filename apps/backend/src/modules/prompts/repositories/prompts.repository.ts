import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, asc, count, eq, ilike, isNull, sql } from 'drizzle-orm';
import { prompts } from '@/modules/prompts/db/prompts.table';
import { promptNamesLockKey } from '@/modules/prompts/helpers/prompt-name.helpers';
import type {
  NewPrompt,
  Prompt,
  PromptListFilters,
} from '@/modules/prompts/typedefs/prompt.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class PromptsRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insert(prompt: NewPrompt): Promise<void> {
    await this.txHost.tx.insert(prompts).values(prompt);
  }

  async lockNames(workspaceId: string): Promise<void> {
    await this.txHost.tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${promptNamesLockKey(workspaceId)}))`,
    );
  }

  async findById(workspaceId: string, promptId: string): Promise<Prompt | null> {
    const [prompt] = await this.txHost.tx
      .select()
      .from(prompts)
      .where(and(this.activeWhere(workspaceId), eq(prompts.id, promptId)));
    return prompt ?? null;
  }

  async findByIdForUpdate(workspaceId: string, promptId: string): Promise<Prompt | null> {
    const [prompt] = await this.txHost.tx
      .select()
      .from(prompts)
      .where(and(this.activeWhere(workspaceId), eq(prompts.id, promptId)))
      .for('update');
    return prompt ?? null;
  }

  async findByName(workspaceId: string, name: string): Promise<Prompt | null> {
    const [prompt] = await this.txHost.tx
      .select()
      .from(prompts)
      .where(and(this.activeWhere(workspaceId), sql`lower(${prompts.name}) = lower(${name})`));
    return prompt ?? null;
  }

  async countByFolder(workspaceId: string, folderId: string): Promise<number> {
    const [row] = await this.txHost.tx
      .select({ total: count() })
      .from(prompts)
      .where(and(this.activeWhere(workspaceId), eq(prompts.folderId, folderId)));
    return row?.total ?? 0;
  }

  list(workspaceId: string, filters?: PromptListFilters): Promise<Prompt[]> {
    const folderId = filters?.folderId ?? null;
    const search = filters?.search ?? null;
    return this.txHost.tx
      .select()
      .from(prompts)
      .where(
        and(
          this.activeWhere(workspaceId),
          folderId === null ? undefined : eq(prompts.folderId, folderId),
          search === null ? undefined : ilike(prompts.name, `%${search}%`),
        ),
      )
      .orderBy(asc(prompts.id));
  }

  rename(workspaceId: string, promptId: string, name: string): Promise<Prompt | null> {
    return this.update(workspaceId, promptId, { name });
  }

  async moveToFolder(
    workspaceId: string,
    promptId: string,
    folderId: string,
    updatedAt: Date,
  ): Promise<boolean> {
    return (await this.update(workspaceId, promptId, { folderId, updatedAt })) !== null;
  }

  async touch(workspaceId: string, promptId: string, updatedAt: Date): Promise<boolean> {
    return (await this.update(workspaceId, promptId, { updatedAt })) !== null;
  }

  async softDelete(workspaceId: string, promptId: string, deletedAt: Date): Promise<boolean> {
    return (await this.update(workspaceId, promptId, { deletedAt })) !== null;
  }

  private activeWhere(workspaceId: string) {
    return and(eq(prompts.workspaceId, workspaceId), isNull(prompts.deletedAt));
  }

  private async update(
    workspaceId: string,
    promptId: string,
    changes: Partial<NewPrompt>,
  ): Promise<Prompt | null> {
    const [prompt] = await this.txHost.tx
      .update(prompts)
      .set(changes)
      .where(and(this.activeWhere(workspaceId), eq(prompts.id, promptId)))
      .returning();
    return prompt ?? null;
  }
}
