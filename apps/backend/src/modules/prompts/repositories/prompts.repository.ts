import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, asc, eq, gt, isNull, sql } from 'drizzle-orm';
import { prompts } from '@/modules/prompts/db/prompts.table';
import type { NewPrompt, Prompt } from '@/modules/prompts/typedefs/prompt.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class PromptsRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insert(prompt: NewPrompt): Promise<void> {
    await this.txHost.tx.insert(prompts).values(prompt);
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

  listPage(workspaceId: string, afterId: string | null, limit: number): Promise<Prompt[]> {
    return this.txHost.tx
      .select()
      .from(prompts)
      .where(
        and(this.activeWhere(workspaceId), afterId === null ? undefined : gt(prompts.id, afterId)),
      )
      .orderBy(asc(prompts.id))
      .limit(limit);
  }

  rename(workspaceId: string, promptId: string, name: string): Promise<boolean> {
    return this.update(workspaceId, promptId, { name });
  }

  moveToFolder(workspaceId: string, promptId: string, folderId: string | null): Promise<boolean> {
    return this.update(workspaceId, promptId, { folderId });
  }

  softDelete(workspaceId: string, promptId: string, deletedAt: Date): Promise<boolean> {
    return this.update(workspaceId, promptId, { deletedAt });
  }

  private activeWhere(workspaceId: string) {
    return and(eq(prompts.workspaceId, workspaceId), isNull(prompts.deletedAt));
  }

  private async update(
    workspaceId: string,
    promptId: string,
    changes: Partial<NewPrompt>,
  ): Promise<boolean> {
    const updated = await this.txHost.tx
      .update(prompts)
      .set(changes)
      .where(and(this.activeWhere(workspaceId), eq(prompts.id, promptId)))
      .returning({ id: prompts.id });
    return updated.length > 0;
  }
}
