import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { eq, isNull, and, sql, asc } from 'drizzle-orm';
import { promptFolders } from '@/modules/prompts/db/prompt-folders.table';
import type {
  NewPromptFolder,
  PromptFolder,
} from '@/modules/prompts/typedefs/prompt-folder.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class PromptFoldersRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insert(folder: NewPromptFolder): Promise<void> {
    await this.txHost.tx.insert(promptFolders).values(folder);
  }

  async findById(workspaceId: string, folderId: string): Promise<PromptFolder | null> {
    const [folder] = await this.txHost.tx
      .select()
      .from(promptFolders)
      .where(and(this.activeWhere(workspaceId), eq(promptFolders.id, folderId)));

    return folder ?? null;
  }

  async findByName(workspaceId: string, name: string): Promise<PromptFolder | null> {
    const [folder] = await this.txHost.tx
      .select()
      .from(promptFolders)
      .where(
        and(this.activeWhere(workspaceId), sql`lower(${promptFolders.name}) = lower(${name})`),
      );

    return folder ?? null;
  }

  listByWorkspace(workspaceId: string): Promise<PromptFolder[]> {
    return this.txHost.tx
      .select()
      .from(promptFolders)
      .where(this.activeWhere(workspaceId))
      .orderBy(asc(promptFolders.name));
  }

  rename(workspaceId: string, folderId: string, name: string): Promise<boolean> {
    return this.update(workspaceId, folderId, { name });
  }

  softDelete(workspaceId: string, folderId: string, deletedAt: Date): Promise<boolean> {
    return this.update(workspaceId, folderId, { deletedAt });
  }

  private activeWhere(workspaceId: string) {
    return and(eq(promptFolders.workspaceId, workspaceId), isNull(promptFolders.deletedAt));
  }

  private async update(
    workspaceId: string,
    folderId: string,
    changes: Partial<NewPromptFolder>,
  ): Promise<boolean> {
    const updated = await this.txHost.tx
      .update(promptFolders)
      .set(changes)
      .where(and(this.activeWhere(workspaceId), eq(promptFolders.id, folderId)))
      .returning({ id: promptFolders.id });

    return updated.length > 0;
  }
}
