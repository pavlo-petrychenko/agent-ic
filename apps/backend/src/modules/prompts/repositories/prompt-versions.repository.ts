import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, isNull, max } from 'drizzle-orm';
import { NO_PROMPT_VERSIONS } from '@/modules/prompts/constants/prompt.constants';
import { promptVersions } from '@/modules/prompts/db/prompt-versions.table';
import type {
  NewPromptVersion,
  PromptVersion,
} from '@/modules/prompts/typedefs/prompt-version.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { storedRow } from '@/platform/database/helpers/stored-row.helpers';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class PromptVersionsRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly clock: ClockService,
  ) {}

  async insert(version: NewPromptVersion): Promise<PromptVersion> {
    return storedRow(
      await this.txHost.tx
        .insert(promptVersions)
        .values({ ...version, createdAt: this.clock.now() })
        .returning(),
    );
  }

  async findById(workspaceId: string, versionId: string): Promise<PromptVersion | null> {
    const [version] = await this.txHost.tx
      .select()
      .from(promptVersions)
      .where(and(this.activeWhere(workspaceId), eq(promptVersions.id, versionId)));
    return version ?? null;
  }

  async summarize(
    workspaceId: string,
    promptIds: readonly string[],
  ): Promise<ReadonlyMap<string, number>> {
    if (promptIds.length === 0) {
      return new Map();
    }
    const rows = await this.txHost.tx
      .select({
        promptId: promptVersions.promptId,
        lastNumber: max(promptVersions.number).mapWith(Number).as('last_number'),
      })
      .from(promptVersions)
      .where(and(this.activeWhere(workspaceId), inArray(promptVersions.promptId, [...promptIds])))
      .groupBy(promptVersions.promptId);
    return new Map(rows.map((row) => [row.promptId, row.lastNumber]));
  }

  listByPrompt(workspaceId: string, promptId: string): Promise<PromptVersion[]> {
    return this.txHost.tx
      .select()
      .from(promptVersions)
      .where(and(this.activeWhere(workspaceId), eq(promptVersions.promptId, promptId)))
      .orderBy(desc(promptVersions.number));
  }

  async findLatest(workspaceId: string, promptId: string): Promise<PromptVersion | null> {
    const [version] = await this.txHost.tx
      .select()
      .from(promptVersions)
      .where(and(this.activeWhere(workspaceId), eq(promptVersions.promptId, promptId)))
      .orderBy(desc(promptVersions.number))
      .limit(1);
    return version ?? null;
  }

  async findByNumber(
    workspaceId: string,
    promptId: string,
    number: number,
  ): Promise<PromptVersion | null> {
    const [version] = await this.txHost.tx
      .select()
      .from(promptVersions)
      .where(
        and(
          this.activeWhere(workspaceId),
          eq(promptVersions.promptId, promptId),
          eq(promptVersions.number, number),
        ),
      );
    return version ?? null;
  }

  async lastNumber(workspaceId: string, promptId: string): Promise<number> {
    const [row] = await this.txHost.tx
      .select({ last: max(promptVersions.number) })
      .from(promptVersions)
      .where(
        and(eq(promptVersions.workspaceId, workspaceId), eq(promptVersions.promptId, promptId)),
      );
    return row?.last ?? NO_PROMPT_VERSIONS;
  }

  async softDeleteByPrompt(
    workspaceId: string,
    promptId: string,
    deletedAt: Date,
  ): Promise<number> {
    const updated = await this.txHost.tx
      .update(promptVersions)
      .set({ deletedAt })
      .where(and(this.activeWhere(workspaceId), eq(promptVersions.promptId, promptId)))
      .returning({ id: promptVersions.id });
    return updated.length;
  }

  private activeWhere(workspaceId: string) {
    return and(eq(promptVersions.workspaceId, workspaceId), isNull(promptVersions.deletedAt));
  }
}
