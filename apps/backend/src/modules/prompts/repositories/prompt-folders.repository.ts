import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { eq, isNull, and, sql, asc } from 'drizzle-orm';
import { promptFolders } from '@/modules/prompts/db/prompt-folders.table';
import { promptFolderNamesLockKey } from '@/modules/prompts/helpers/prompt-folder-name.helpers';
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

  async lockNames(workspaceId: string): Promise<void> {
    await this.txHost.tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${promptFolderNamesLockKey(workspaceId)}))`,
    );
  }

  async findById(workspaceId: string, folderId: string): Promise<PromptFolder | null> {
    const [folder] = await this.txHost.tx
      .select()
      .from(promptFolders)
      .where(and(this.activeWhere(workspaceId), eq(promptFolders.id, folderId)));

    return folder ?? null;
  }

  async findByIdForUpdate(workspaceId: string, folderId: string): Promise<PromptFolder | null> {
    const [folder] = await this.txHost.tx
      .select()
      .from(promptFolders)
      .where(and(this.activeWhere(workspaceId), eq(promptFolders.id, folderId)))
      .for('update');

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

  rename(workspaceId: string, folderId: string, name: string): Promise<PromptFolder | null> {
    return this.update(workspaceId, folderId, { name });
  }

  async softDelete(workspaceId: string, folderId: string, deletedAt: Date): Promise<boolean> {
    return (await this.update(workspaceId, folderId, { deletedAt })) !== null;
  }

  private activeWhere(workspaceId: string) {
    return and(eq(promptFolders.workspaceId, workspaceId), isNull(promptFolders.deletedAt));
  }

  private async update(
    workspaceId: string,
    folderId: string,
    changes: Partial<NewPromptFolder>,
  ): Promise<PromptFolder | null> {
    const [folder] = await this.txHost.tx
      .update(promptFolders)
      .set(changes)
      .where(and(this.activeWhere(workspaceId), eq(promptFolders.id, folderId)))
      .returning();

    return folder ?? null;
  }
}
